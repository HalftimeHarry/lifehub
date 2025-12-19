import { json } from '@sveltejs/kit';
import PocketBase from 'pocketbase';
import { VITE_POCKETBASE_URL } from '$env/static/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const pb = new PocketBase(VITE_POCKETBASE_URL);
	const includeSummary = url.searchParams.get('include') === 'summary';

	try {
		// Get all trips
		const trips = await pb.collection('trips').getFullList({
			sort: '-depart_at'
		});

		if (!includeSummary) {
			return json({ trips });
		}

		// Get all expenses grouped by trip
		const allExpenses = await pb.collection('expenses').getFullList({
			filter: 'trip != ""'
		});

		// Group expenses by trip
		const expensesByTrip: Record<string, any[]> = {};
		allExpenses.forEach((expense) => {
			const tripId = expense.trip;
			if (!expensesByTrip[tripId]) {
				expensesByTrip[tripId] = [];
			}
			expensesByTrip[tripId].push(expense);
		});

		// Build trip summaries
		const tripsWithSummaries = trips.map((trip) => {
			const tripExpenses = expensesByTrip[trip.id] || [];
			const totalExpenses = tripExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
			const expenseCount = tripExpenses.length;
			const budget = trip.budget || 0;
			const budgetRemaining = budget - totalExpenses;
			const overBudget = budget > 0 && budgetRemaining < 0;
			const percentUsed = budget > 0 ? (totalExpenses / budget) * 100 : 0;

			// Category breakdown
			const categoryBreakdown: Record<string, number> = {};
			tripExpenses.forEach((expense) => {
				const category = expense.category || 'other';
				categoryBreakdown[category] = (categoryBreakdown[category] || 0) + expense.amount;
			});

			return {
				trip: {
					id: trip.id,
					title: trip.title,
					origin: trip.origin,
					destination: trip.destination,
					depart_at: trip.depart_at,
					arrive_at: trip.arrive_at,
					status: trip.status,
					budget: trip.budget || 0,
					transport_type: trip.transport_type
				},
				summary: {
					totalExpenses,
					expenseCount,
					budgetRemaining,
					overBudget,
					percentUsed: Math.round(percentUsed * 100) / 100,
					categoryBreakdown
				}
			};
		});

		return json({ trips: tripsWithSummaries });
	} catch (error) {
		console.error('Error fetching trips:', error);
		return json(
			{
				error: 'Failed to fetch trips',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

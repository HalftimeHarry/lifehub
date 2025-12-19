import { json } from '@sveltejs/kit';
import PocketBase from 'pocketbase';
import { VITE_POCKETBASE_URL } from '$env/static/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const pb = new PocketBase(VITE_POCKETBASE_URL);
	const tripId = params.id;

	try {
		// Get trip details
		const trip = await pb.collection('trips').getOne(tripId);

		// Get all expenses for this trip
		const expenses = await pb.collection('expenses').getFullList({
			filter: `trip = "${tripId}"`,
			sort: '-date'
		});

		// Calculate summary
		const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
		const expenseCount = expenses.length;
		const budget = trip.budget || 0;
		const budgetRemaining = budget - totalExpenses;
		const overBudget = budget > 0 && budgetRemaining < 0;
		const percentUsed = budget > 0 ? (totalExpenses / budget) * 100 : 0;

		// Category breakdown
		const categoryBreakdown: Record<string, number> = {};
		expenses.forEach((expense) => {
			const category = expense.category || 'other';
			categoryBreakdown[category] = (categoryBreakdown[category] || 0) + expense.amount;
		});

		// Status breakdown
		const statusBreakdown: Record<string, number> = {};
		expenses.forEach((expense) => {
			const status = expense.status || 'unknown';
			statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
		});

		return json({
			trip: {
				id: trip.id,
				title: trip.title,
				origin: trip.origin,
				destination: trip.destination,
				depart_at: trip.depart_at,
				arrive_at: trip.arrive_at,
				status: trip.status,
				budget: trip.budget || 0,
				transport_type: trip.transport_type,
				people: trip.people || [],
				notes: trip.notes || ''
			},
			summary: {
				totalExpenses,
				expenseCount,
				budgetRemaining,
				overBudget,
				percentUsed: Math.round(percentUsed * 100) / 100,
				categoryBreakdown,
				statusBreakdown
			},
			expenses: expenses.map((e) => ({
				id: e.id,
				title: e.title,
				amount: e.amount,
				category: e.category,
				date: e.date,
				status: e.status,
				notes: e.notes
			}))
		});
	} catch (error) {
		console.error('Error fetching trip summary:', error);
		return json(
			{
				error: 'Failed to fetch trip summary',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

# Add Email Field to PocketBase Collections

## Manual Steps Required

Go to your PocketBase admin panel (Railway or local):
- Production: https://pocketbase-production-f733.up.railway.app/_/
- Local: http://127.0.0.1:8090/_/

For each of these collections, add an **email** field:
1. **appointments**
2. **tasks**
3. **trips**
4. **shifts**

### Steps for each collection:
1. Click on the collection name
2. Click "Edit collection" (gear icon)
3. Click "+ New field"
4. Select "Email" type
5. Name: `email`
6. Options: Leave as optional (not required)
7. Click "Save"

This will allow users to receive reminders via email instead of WhatsApp/SMS.

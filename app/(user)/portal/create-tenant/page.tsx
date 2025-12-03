"use client";

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createTenantAction } from './actions';
import { AlertCircle } from 'lucide-react';

const initialState = {
  message: '',
  error: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full px-4 py-2 font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {pending ? 'Creating...' : 'Create Workspace'}
    </button>
  );
}

export default function CreateTenantPage() {
  const [state, formAction, isPending] = useActionState(createTenantAction, initialState);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-900">
          Create your Workspace
        </h1>
        <p className="text-center text-gray-600">
          Give your new workspace a name to get started.
        </p>

        {state?.error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-6">
          <div>
            <label htmlFor="tenantName" className="block text-sm font-medium text-gray-700">
              Workspace Name
            </label>
            <input
              id="tenantName"
              name="tenantName"
              type="text"
              required
              className="w-full px-3 py-2 mt-1 text-gray-900 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., My Company's Workspace"
            />
          </div>
          <div>
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  );
}

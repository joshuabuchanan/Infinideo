import 'server-only'; // <-- ensure this file cannot be imported from the client

import { createHydrationHelpers } from '@trpc/react-query/rsc';
import { createCallerFactory, createTRPCContext } from './init';
import { makeQueryClient } from './query-client';
import { appRouter, type AppRouter } from './routers/_app';

const createCaller = createCallerFactory(appRouter);
const caller = createCaller(() => createTRPCContext());

export const { trpc, HydrateClient } = createHydrationHelpers<AppRouter>(
	caller,
	makeQueryClient,
);

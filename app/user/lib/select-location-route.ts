import type { Href } from 'expo-router';

export const SELECT_LOCATION_HREF = '/(app)/location' as Href;
/** Add-address step 1: pick the spot on the map. */
export const ADD_ADDRESS_HREF = '/(app)/location/add' as Href;
/** Add-address step 2 (and the edit screen): house, label and receiver details. */
export const ADDRESS_DETAILS_HREF = '/(app)/location/details' as Href;

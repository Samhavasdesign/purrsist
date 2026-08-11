/** Client-safe payload for the one-time Today rescue toast. */
export type RescueToastPayload = {
  rescueId: string;
  catId: string;
  catName: string;
  imageKey: string;
  weekStartDate: string;
};

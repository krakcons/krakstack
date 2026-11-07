export * from "./contact.atom.js";
export * from "./campaign.atom.js";
export * from "./operations.atom.js";
export * from "./delivery.atom.js";
import { makeSendContactAtoms } from "./contact.atom.js";
import { makeSendCampaignAtoms } from "./campaign.atom.js";
import { makeSendOperationsAtoms } from "./operations.atom.js";

export const makeNotificationContactAtoms = makeSendContactAtoms;
export const makeNotificationCampaignAtoms = makeSendCampaignAtoms;
export const makeNotificationOperationsAtoms = makeSendOperationsAtoms;

import { mountAuctionResult, unmountAuctionResult } from "../auction_result.js";

export function mount(root) {
  mountAuctionResult(root);
}

export function unmount() {
  unmountAuctionResult();
}

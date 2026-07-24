// js/list/list-state.js

export const state = {
  currentUser: null,
  currentListId: null,
  currentListOwnerId: null,
  currentListObj: null,
  selectedVisibility: "Private",
  tempSelectedMangas: [],
  currentTriggerSource: "create",
};

export function resetState() {
  state.currentListId = null;
  state.currentListOwnerId = null;
  state.currentListObj = null;
  state.selectedVisibility = "Private";
  state.tempSelectedMangas = [];
  state.currentTriggerSource = "create";
}

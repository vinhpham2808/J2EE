let showFn = null;
let hideFn = null;

export const registerLoadingHandlers = (show, hide) => {
  showFn = show;
  hideFn = hide;
};

export const axiosShowLoading = (msg) => {
  if (showFn) {
    showFn(msg);
  }
};

export const axiosHideLoading = () => {
  if (hideFn) {
    hideFn();
  }
};

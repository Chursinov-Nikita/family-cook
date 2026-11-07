let visits = 0;

export const markVisit = () => {
  visits += 1;
};

export const canGoBack = () => visits > 1;

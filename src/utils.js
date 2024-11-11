export function shuffle(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function parseDrawOptions(text) {
  const options = {
    includeLikes: true,
    includeComments: true,
    includeReposts: true
  };

  if (text.includes('no-likes')) options.includeLikes = false;
  if (text.includes('no-comments')) options.includeComments = false;
  if (text.includes('no-reposts')) options.includeReposts = false;

  return options;
}
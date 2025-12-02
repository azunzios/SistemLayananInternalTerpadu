export const generateBoringAvatarUrl = (name: string): string => {
  const initials = name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);

  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(initials)}&backgroundColor=random&textColor=fff`;
};

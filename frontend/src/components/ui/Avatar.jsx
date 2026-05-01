import React from 'react';

const Avatar = ({ name, size = 'md', className = '' }) => {
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  // Generate a consistent color based on name string
  const getAvatarColor = (name) => {
    if (!name) return 'bg-gray-600';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['bg-red-600', 'bg-blue-600', 'bg-green-600', 'bg-yellow-600', 'bg-indigo-600', 'bg-purple-600', 'bg-pink-600'];
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className={`relative flex shrink-0 overflow-hidden rounded-full font-medium text-white items-center justify-center ${sizes[size]} ${getAvatarColor(name)} ${className}`}>
      {getInitials(name)}
    </div>
  );
};

export default Avatar;

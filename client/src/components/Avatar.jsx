import './Avatar.css';

const COLORS = [
  '#3b82f6','#8b5cf6','#ec4899','#f59e0b','#10b981','#06b6d4','#ef4444',
];

function hashColor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

export function Avatar({ user, size = 28 }) {
  if (!user) return <div className="avatar avatar--empty" style={{ width: size, height: size }} />;
  const initials = user.avatar ?? user.name.split(' ').map(n => n[0]).join('').substring(0, 2);
  const bg = hashColor(user.id ?? user.name);
  return (
    <div
      className="avatar"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.38 }}
      title={user.name}
      aria-label={user.name}
    >
      {initials}
    </div>
  );
}

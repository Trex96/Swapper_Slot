import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'system') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('light');
    } else {
      setTheme('system');
    }
  };

  const getIcon = () => {
    if (theme === 'system') {
      return <Icons.Monitor className="h-4 w-4" />;
    } else if (theme === 'dark') {
      return <Icons.Moon className="h-4 w-4" />;
    } else {
      return <Icons.Sun className="h-4 w-4" />;
    }
  };

  const getLabel = () => {
    if (theme === 'system') {
      return 'System';
    } else if (theme === 'dark') {
      return 'Dark';
    } else {
      return 'Light';
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'system' ? 'dark' : theme === 'dark' ? 'light' : 'system'} mode`}
    >
      {getIcon()}
      <span className="sr-only">Toggle theme ({getLabel()})</span>
    </Button>
  );
}
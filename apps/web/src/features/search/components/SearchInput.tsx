import { Search, X } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'ابحث عن موزع، باقة، فاتورة، خط، أو مصروف...',
}: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="ps-10 pe-10 h-12 text-base"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange('')}
          className="absolute end-1 top-1/2 -translate-y-1/2 h-8 w-8"
          aria-label="مسح البحث"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

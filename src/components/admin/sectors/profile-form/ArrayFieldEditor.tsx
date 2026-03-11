
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

interface ArrayFieldEditorProps {
  title: string;
  field: string[];
  placeholder: string;
  description?: string;
  onChange: (newArray: string[]) => void;
}

export const ArrayFieldEditor: React.FC<ArrayFieldEditorProps> = ({
  title,
  field,
  placeholder,
  description,
  onChange
}) => {
  const updateArrayItem = (index: number, value: string) => {
    const newArray = [...field];
    newArray[index] = value;
    onChange(newArray);
  };

  const addArrayItem = () => {
    onChange([...field, '']);
  };

  const removeArrayItem = (index: number) => {
    const newArray = field.filter((_, i) => i !== index);
    onChange(newArray.length > 0 ? newArray : ['']);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-medium">{title}</Label>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
      </div>
      {field.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={item}
            onChange={(e) => updateArrayItem(index, e.target.value)}
            placeholder={placeholder}
            className="flex-1"
          />
          {field.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeArrayItem(index)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addArrayItem}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Adicionar {title.toLowerCase()}
      </Button>
    </div>
  );
};

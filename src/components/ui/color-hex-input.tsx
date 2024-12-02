import React, { useState } from 'react';
import { Input } from './input';
import { Label } from './label';

export interface ColorHexInputProps {
    text: string;
    value: string;
    placeholder: string;
    onChange: Function;
  }
  
export const ColorHexInput = (props: ColorHexInputProps) => {
  const [inputValue, setInputValue] = useState(props.value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toLowerCase();

    // Ensure the value starts with a "#"
    if (!value.startsWith('#')) {
      value = '#' + value.replace(/[^0-9a-f]/gi, '');
    } else {
      // Remove any non-hexadecimal characters, but allow for the leading "#"
      value = '#' + value.slice(1).replace(/[^0-9a-f]/gi, '');
    }

    // Update the local state
    setInputValue(value);

    // Only trigger onChange if the value is a valid 7-character hex code (including the "#")
    if (/^#[0-9a-f]{6}$/i.test(value)) {
      props.onChange(value);
    }
  };

  return (
    <div className="mb-4 flex space-x-2">
      <div className='flex items-center justify-start w-1/2'>
        <Label className="items-center text-xs font-semibold">{props.text}</Label>
      </div>
      <div className='flex items-center justify-end w-1/2'>
        <div className="flex items-center space-x-4 resize-none">
          <Input
            className="border leading-tight text-xs"
            value={inputValue}
            onChange={handleChange}
            placeholder={props.placeholder}
          />
        </div>
      </div>
      <div
        className="w-[10px] rounded-full border"
        style={{ backgroundColor: inputValue }}
      ></div>
    </div>
  );
};
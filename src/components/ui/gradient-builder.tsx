import React, { useEffect, useState } from 'react';

import { ColorHexInput } from './color-hex-input';
import { DEFAULT_GRADIENT } from '@/constants';

export interface GradientBuilderProps {
  currentGradient: string[]
  onChange: Function;
}

const GradientBuilder = (props: GradientBuilderProps) => {
  const [waterColor, setWaterColor] = useState(props.currentGradient[0]);
  const [lowTopoColor, setLowTopoColor] = useState(props.currentGradient[1]);
  const [midTopoColor, setMidTopoColor] = useState(props.currentGradient[2]);
  const [highTopoColor, setHighTopoColor] = useState(props.currentGradient[3]);

  useEffect(() =>
  {
      props.onChange([waterColor, lowTopoColor, midTopoColor, highTopoColor]);
  }, [waterColor, lowTopoColor, midTopoColor, highTopoColor]);

  return (
    <div>
      <ColorHexInput text="Highlands" value={highTopoColor} placeholder={DEFAULT_GRADIENT[3]} onChange={setHighTopoColor}></ColorHexInput>
      <ColorHexInput text="Midlands" value={midTopoColor} placeholder={DEFAULT_GRADIENT[2]} onChange={setMidTopoColor}></ColorHexInput>
      <ColorHexInput text="Lowlands" value={lowTopoColor} placeholder={DEFAULT_GRADIENT[1]} onChange={setLowTopoColor}></ColorHexInput>
      <ColorHexInput text="Water" value={waterColor} placeholder={DEFAULT_GRADIENT[0]} onChange={setWaterColor}></ColorHexInput>
    </div>
  );
};

export default GradientBuilder;

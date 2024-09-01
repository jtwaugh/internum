import React, { useEffect, useState } from 'react';

import { ColorHexInput } from './ColorHexInput';
import { DEFAULT_GRADIENT } from '@/constants';

export interface GradientBuilderProps {
  currentGradient: string[]
  onChange: Function;
}

const GradientBuilder = (props: GradientBuilderProps) => {
  const [waterColor, setWaterColor] = useState(props.currentGradient[0]);
  const [lowTopoColor, setLowTopoColor] = useState(props.currentGradient[1]);
  const [highTopoColor, setHighTopoColor] = useState(props.currentGradient[2]);

  useEffect(() =>
  {
      console.log([waterColor, lowTopoColor, highTopoColor]);
      props.onChange([waterColor, lowTopoColor, highTopoColor]);
  }, [waterColor, lowTopoColor, highTopoColor]);

  return (
    <div>
      <ColorHexInput text="Water" value={waterColor} placeholder={DEFAULT_GRADIENT[0]} onChange={setWaterColor}></ColorHexInput>
      <ColorHexInput text="Lowlands" value={lowTopoColor} placeholder={DEFAULT_GRADIENT[1]} onChange={setLowTopoColor}></ColorHexInput>
      <ColorHexInput text="Highlands" value={highTopoColor} placeholder={DEFAULT_GRADIENT[2]} onChange={setHighTopoColor}></ColorHexInput>
    </div>
  );
};

export default GradientBuilder;

"use client";

import React, { useState, useEffect, useRef } from 'react';

import * as Constants from '@/constants';

import { useElementWidth } from '@/useElementWidth';
import { Slider } from '@/components/ui/slider';
import { Button } from './button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import { World, ColorsConfig, WorldGenParams } from '@/types';
import GradientBuilder from './gradient-builder';
import { ColorHexInput } from './color-hex-input';
import { generateWorldTerrain, getRandomLandTile, findHighestPoint, findClosestWaterBorder, accumulateWater, computeFlowDirection } from '@/world-gen';


interface IslandGeneratorProps {
  onWorldGenerated: (world: World | null) => void;
  onColorsChanged: (colorsConfig: ColorsConfig) => void;
  onParamsChanged: (params: WorldGenParams) => void;
  params: WorldGenParams;
  display: boolean;
}

const IslandGenerator: React.FC<IslandGeneratorProps> = (props: IslandGeneratorProps) => {
  const [noiseScale, setNoiseScale] = useState(props.params.noiseScale);
  const [canvasSize, setCanvasSize] = useState(props.params.canvasSize);
  const [threshold, setThreshold] = useState(props.params.threshold);
  const [maxDistanceFactor, setMaxDistanceFactor] = useState(props.params.maxDistanceFactor);
  const [blurIterations, setBlurIterations] = useState(props.params.blurIterations);

  const [gradient, setGradient] = useState(Constants.DEFAULT_GRADIENT);
  const [ambientLightColor, setAmbientLightColor] = useState(Constants.DEFAULT_AMBIENT_LIGHT_COLOR);
  const [directionalLightColor, setDirectionalLightColor] = useState(Constants.DEFAULT_DIRECTIONAL_LIGHT_COLOR);

  const [paramsButtonRef, paramsButtonWidth] = useElementWidth<HTMLButtonElement>();
  const [colorsButtonRef, colorsButtonWidth] = useElementWidth<HTMLButtonElement>();


  useEffect(() => {
    props.onColorsChanged(
      {
        terrainGradient: gradient, 
        ambientLight: ambientLightColor, 
        directionalLight: directionalLightColor
      }
    );
  }, [gradient, ambientLightColor, directionalLightColor]);

  useEffect(() => {
    props.onParamsChanged(
      {
        noiseScale: noiseScale,
        canvasSize: canvasSize,
        threshold: threshold,
        maxDistanceFactor: maxDistanceFactor,
        blurIterations: blurIterations
      }
    )
  }, [noiseScale, canvasSize, threshold, maxDistanceFactor, blurIterations])

  useEffect(() => {
    setNoiseScale(props.params.noiseScale);
    setCanvasSize(props.params.canvasSize);
    setThreshold(props.params.threshold);
    setMaxDistanceFactor(props.params.maxDistanceFactor);
    setBlurIterations(props.params.blurIterations);
  }, [props.params]);


  const handleGenerate = () => {
    const params = {
      noiseScale: noiseScale,
      canvasSize: canvasSize,
      threshold: threshold,
      maxDistanceFactor: maxDistanceFactor,
      blurIterations: blurIterations
    };
    
    const blurredHeightmap = generateWorldTerrain(params);
    console.log(JSON.stringify(blurredHeightmap));

    // const blurredHeightmap = [
    //   [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    //   [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    //   [0,0,0,0.005217746645500606,0.005217746645500606,0.005217746645500606,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    //   [0,0,0,0.010380146198553057,0.027616892840928095,0.02248380304250601,0.0195279633896796,0.012726710038305772,0.007424306545726647,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    //   [0,0,0,0.010380146198553057,0.03539391418607384,0.05627279554142251,0.061234154154152745,0.058913379266206836,0.02646359241604762,0.00812438788717493,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    //   [0,0,0,0.005162399553052452,0.02562683797465665,0.07324002570369591,0.11507154917033223,0.12256723018082544,0.09839003971501516,0.04864589499230056,0.023904332384762715,0.01735460572935584,0.012678161130201294,0.006691859739680218,0,0,0,0,0,0,0,0,0,0,0],
    //   [0,0,0,0,0.020929893826183973,0.07623943204488418,0.14758964923470985,0.1962235266855143,0.19317050876767075,0.13709403387685992,0.08031231291382794,0.06809858377908855,0.05983781884251527,0.03473140201500014,0.01440099769646741,0.006997584340872129,0,0,0,0,0,0,0,0,0],
    //   [0,0,0,0.0055532091546730755,0.03559201458386543,0.1009973089496993,0.18220602176216624,0.23847122546175725,0.2543886136714378,0.2160002878035017,0.15691642686585927,0.13334382370145717,0.11336670117967187,0.08443287667296125,0.05487890491083456,0.022766276781919725,0.005877345123730807,0,0,0,0,0,0,0,0],
    //   [0,0,0.006443246305946585,0.02497045539181695,0.0774353312466682,0.14650338826004583,0.1959552160768002,0.23541967450908335,0.25306816294193013,0.2541862186103734,0.22873631954618184,0.18931966506159253,0.15497608415874506,0.1292454750529559,0.09536842324866965,0.05784477753831247,0.015404158284180876,0,0,0,0,0,0,0,0],
    //   [0,0,0.01486456046754081,0.056163759757966614,0.11434786037008514,0.14916393959881605,0.17000504353011733,0.1920116926275165,0.23669103545470593,0.26848357580046395,0.27360830512566986,0.24816993355993267,0.20699542602542784,0.16506571139756995,0.1385516596175494,0.09441690870591964,0.03443876212942372,0.0051738266047364955,0,0,0,0,0,0,0],
    //   [0,0,0.01486456046754081,0.05456668631458882,0.0856210194052916,0.09507350116049179,0.09035661617904295,0.12841417938438893,0.19423157605175662,0.25136403957763614,0.28397104607568474,0.29801229333659074,0.27401663918676566,0.23418323090392662,0.2022829094837003,0.15581606836241121,0.08691079371900087,0.02844293039536683,0.008311924992912723,0,0,0,0,0,0],
    //   [0,0,0.008421314161594225,0.018306811754256493,0.029337656326322136,0.026953517009770125,0.02906601474480527,0.05010761492325432,0.12015749347040824,0.19131158431904838,0.2566417367948816,0.3124545909290623,0.32652047044121096,0.31451581674025997,0.2929403100577069,0.24854486126955203,0.1822303126269922,0.10273937090013256,0.03821223139596952,0.006565586364688483,0,0,0,0,0],
    //   [0,0,0,0,0,0,0,0.010560415493159251,0.040261672288850824,0.11747575167949394,0.20102737061490636,0.2889137893147071,0.3526990462177342,0.3688231903586365,0.3579993210679772,0.3311954755557488,0.2774538049900747,0.19428689862761114,0.08946872822000186,0.020965035416876273,0,0,0.006152452414305903,0.006152452414305903,0],
    //   [0,0,0,0,0,0,0,0,0.01118966989874935,0.05726791802548519,0.15978645717291426,0.26503619359637576,0.3457205884768416,0.37717774561890194,0.3814334782363675,0.36466156521219106,0.319002284729526,0.23903601704109645,0.1343380986183003,0.03546116593068128,0,0,0.006152452414305903,0.023066238046256758,0],
    //   [0,0,0,0,0,0,0,0.00670529570349182,0.019189559004792543,0.07004530617661792,0.16516674106582407,0.26703936726968197,0.3257439573694698,0.3548149119760433,0.360322276100081,0.3548460344317177,0.3158239370831088,0.24457267005556754,0.1504860964017668,0.052381568347752164,0.009045200853061026,0,0.006152452414305903,0.010761333217644952,0.05069768883672954],
    //   [0,0,0,0,0,0,0,0.015626608990053085,0.05917468791189204,0.1360141828358447,0.2171223059472989,0.27986895224925,0.3060032545616156,0.30946217872063875,0.3145024201194546,0.30067276622137634,0.2655728248177112,0.21040252683426394,0.14512784029748815,0.08811205433071057,0.02815421208801917,0.008219096320609248,0,0.004608880803339049,0],
    //   [0,0,0,0,0,0,0.007717917406758792,0.03797321613306814,0.10923656886578818,0.1973411439057732,0.2680786618050006,0.2861336138945619,0.2730909046649938,0.2629713661526775,0.25187063464829196,0.224933893555507,0.1707657300788883,0.13941802734012787,0.13137464530172419,0.1114819102727327,0.06979516875596693,0.02057128217349191,0,0,0],
    //   [0,0,0,0,0,0.010622921239824501,0.03561749305429786,0.09601338907565465,0.16639701145446234,0.24020208827354922,0.28030191977474467,0.2711215321360892,0.22977567069592694,0.20206572153706448,0.18243772713677453,0.14829509724528553,0.11521993450248208,0.09309197959599357,0.10261624063082007,0.1167168974111409,0.08534353506203461,0.029391443442170505,0,0,0],
    //   [0,0,0,0,0,0.025068803010416783,0.09244253847300442,0.1618593984017111,0.21420123802844115,0.25024760083364106,0.25801985614433476,0.23204786946074202,0.1700903415786895,0.1207966175442471,0.11404934825490805,0.12089143456860446,0.10834469926163305,0.09961926923987634,0.0904651303526125,0.08285113070550433,0.059170474658668315,0.021172347121561255,0,0,0],
    //   [0,0,0,0,0,0.037062898460131416,0.11962442110069828,0.1883320691446377,0.2111837661509055,0.2197661681511303,0.21415226773576854,0.16855781254309513,0.10300479218336801,0.05204074082343799,0.063712595822071,0.0903702612056197,0.10542551275832877,0.11024188240235056,0.08234110783043454,0.04011584298948806,0.01632738809458185,0.008820161268678593,0,0,0],
    //   [0,0,0,0,0,0.02643997722030692,0.095816750423927,0.14530247259889634,0.15827395360130192,0.16216376314489958,0.14789151876427512,0.09666548129083476,0.0381031724485218,0.028451890691245315,0.022671625717295543,0.03649979351339978,0.07044727872837435,0.08085126026759924,0.05252162556249685,0.015316193588315955,0,0,0,0,0],
    //   [0,0,0,0,0,0.011994095449714637,0.03624935658544018,0.07712401216683135,0.08781706557133542,0.08317133854175138,0.07023385080892654,0.0340527927594232,0.013814384679226658,0.004563427700830377,0.004563427700830377,0.007939359324810668,0.019364103197936224,0.025819827466977894,0.017880468142167226,0.006455724269041669,0,0,0,0,0],
    //   [0,0,0,0,0,0,0.008995477612523072,0.018027112577344927,0.02446259670472406,0.022250231042142077,0.013218596077320222,0.006783111949941089,0,0,0,0,0,0,0,0,0,0,0,0,0],
    //   [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    //   [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    // ];


    // TEST
    // const testFlowDirections1 = computeFlowDirection([[0, 0, 0, 0],[0, 1, 1, 0],[0, 1, 1, 0], [0, 0, 0, 0]], params);
    // const testFlowDirections2 = computeFlowDirection(blurredHeightmap, params);

    const flowDirections = computeFlowDirection(blurredHeightmap);
    const precipitation = accumulateWater(flowDirections, blurredHeightmap);
    const townSquarePosition = getRandomLandTile(blurredHeightmap, params);
    const templePosition = findHighestPoint(blurredHeightmap, townSquarePosition, Constants.TEMPLE_MIN_RADIUS, Constants.TEMPLE_MAX_RADIUS);
    const docksPosition = findClosestWaterBorder(blurredHeightmap, townSquarePosition, params);

    // const townSquarePosition = {x: 0, y: 0};
    // const templePosition = {x: 0, y: 0};
    // const docksPosition = {x: 0, y: 0};

    props.onWorldGenerated(
      {
        heightmap: blurredHeightmap, 
        flowDirections: flowDirections, 
        precipitation: precipitation, 
        townSquare: townSquarePosition, 
        temple: templePosition, 
        docks: docksPosition
      }
    );
  };

  const onGradientChanged = (newGradient: string[]) => {
    setGradient(newGradient);
  }

  if (!props.display) {
    return <></>;
  }

  return (
    <div id='island-generator-container' className='h-full' tabIndex={1}>
      <div className="border h-full flex flex-col">
        <div className="w-full p-2">
          <Button className='w-full pt-6 pb-6 border' style={{backgroundColor: "#0000aa"}} onClick={handleGenerate}><div className=' text-2xl font-extrabold'>Generate</div></Button>
        </div>
        <Tabs defaultValue="worldgen" className="flex-1 flex flex-col p-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger ref={paramsButtonRef} value="worldgen">{paramsButtonWidth > 100 ? "🌐 Parameters" : "🌐"}</TabsTrigger>
            <TabsTrigger ref={colorsButtonRef} value="colors">{colorsButtonWidth > 100 ? "🎨 Colors" : "🎨"}</TabsTrigger>
          </TabsList>
          <TabsContent value="worldgen" className='flex-1 bg-slate-50 border rounded-md p-2'>
            <div>
              <label>
                <span className='p-2 font-bold text-xs'>Noise Scale: {noiseScale}</span>
                <Slider
                  className='p-2'
                  min={0.01}
                  max={0.3}
                  step={0.01}
                  value={[noiseScale]}
                  onValueChange={(values) => setNoiseScale(values[0])}
                />
              </label>
            </div>
            <div>
              <label>
                <span className='p-2 font-bold text-xs'>Canvas Size: {canvasSize}</span>
                  <Slider
                    className='p-2'
                    min={0}
                    max={800}
                    step={25}
                    value={[canvasSize]}
                    onValueChange={(values) => setCanvasSize(values[0])}
                  />
              </label>
            </div>
            <div>
              <label>
              <span className='p-2 font-bold text-xs'>Max Distance Factor: {maxDistanceFactor}</span>
                <Slider
                  className='p-2'
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={[maxDistanceFactor]}
                  onValueChange={(values) => setMaxDistanceFactor(values[0])}
                />
              </label>
            </div>
            <div>
              <label>
              <span className='p-2 font-bold text-xs'>Threshold: {threshold}</span>
                <Slider
                  className='p-2'
                  min={0.0}
                  max={1.0}
                  step={0.05}
                  value={[threshold]}
                  onValueChange={(values) => setThreshold(values[0])}
                />
              </label>
            </div>
            <div>
              <label>
              <span className='p-2 font-bold text-xs'>Blur Iterations: {blurIterations}</span>
                <Slider
                  className='p-2'
                  min={0.0}
                  max={10.0}
                  step={1.0}
                  value={[blurIterations]}
                  onValueChange={(values) => {
                    setBlurIterations(values[0]);
                  }
                    }
                />
              </label>
            </div>
          </TabsContent>
          <TabsContent value="colors" className='flex-1 bg-slate-50 border rounded-md p-2'>
            <ColorHexInput text="Ambient Light" value={ambientLightColor} placeholder={Constants.DEFAULT_AMBIENT_LIGHT_COLOR} onChange={setAmbientLightColor}></ColorHexInput>
            <ColorHexInput text="Directional Light" value={directionalLightColor} placeholder={Constants.DEFAULT_DIRECTIONAL_LIGHT_COLOR} onChange={setDirectionalLightColor}></ColorHexInput>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className='flex'>
                  <div className='w-1/2 text-start'>Gradient</div> 
                  <div className='w-1/2 border h-full rounded-md mr-2 ml-4' style={{
                        background: `linear-gradient(180deg, ${gradient[3]}, ${gradient[2]}, ${gradient[1]}, ${gradient[0]})`,
                      }}/>
                </AccordionTrigger>
                <AccordionContent>
                  <GradientBuilder currentGradient={gradient} onChange={onGradientChanged}/>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default IslandGenerator;


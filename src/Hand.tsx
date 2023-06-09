// @ts-nocheck
import { useState, useEffect, FC } from 'react';
import DeckGL from '@deck.gl/react/typed';
import { H3HexagonLayer } from '@deck.gl/geo-layers/typed';
import { Map } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import { createStyles, AppShell, Navbar, Header, UnstyledButton, Tooltip, Title, Text, Select, MultiSelect, Stack, Group, Divider, ScrollArea, RangeSlider, rem } from '@mantine/core';

import mapstyle from './basemap.json';
import legend from './legend.json';

const useStyles = createStyles((theme) => ({
  wrapper: {
    display: 'flex',
  },

  aside: {
    flex: `0 0 ${rem(60)}`,
    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderRight: `${rem(1)} solid ${theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[3]
      }`,
  },

  main: {
    flex: 1,
    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
  },

  mainLink: {
    width: rem(44),
    height: rem(44),
    borderRadius: theme.radius.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[7],

    '&:hover': {
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[0],
    },
  },

  mainLinkActive: {
    '&, &:hover': {
      backgroundColor: theme.fn.variant({ variant: 'light', color: theme.primaryColor }).background,
      color: theme.fn.variant({ variant: 'light', color: theme.primaryColor }).color,
    },
  },

  title: {
    boxSizing: 'border-box',
    fontFamily: `Greycliff CF, ${theme.fontFamily}`,
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
    padding: theme.spacing.md,
    paddingTop: rem(18),
    height: rem(60),
    borderBottom: `${rem(1)} solid ${theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[3]
      }`,
  },

  logo: {
    boxSizing: 'border-box',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    height: rem(60),
    paddingTop: theme.spacing.md,
    borderBottom: `${rem(1)} solid ${theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[3]
      }`,
    marginBottom: theme.spacing.xl,
  },

  link: {
    boxSizing: 'border-box',
    display: 'block',
    textDecoration: 'none',
    borderTopRightRadius: theme.radius.md,
    borderBottomRightRadius: theme.radius.md,
    color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[7],
    padding: `0 ${theme.spacing.md}`,
    fontSize: theme.fontSizes.sm,
    marginRight: theme.spacing.md,
    fontWeight: 500,
    height: rem(44),
    lineHeight: rem(44),

    '&:hover': {
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[1],
      color: theme.colorScheme === 'dark' ? theme.white : theme.black,
    },
  },

  linkActive: {
    '&, &:hover': {
      borderLeftColor: theme.fn.variant({ variant: 'filled', color: theme.primaryColor })
        .background,
      backgroundColor: theme.fn.variant({ variant: 'filled', color: theme.primaryColor })
        .background,
      color: theme.white,
    },
  },
}));

const variablesAvaliable = ['spco2', 'o2', 'chl', 'expc', 'zooc', 'no3', 'po4', 'phyc', 'si', 'ph', 'kd', 'nppv', 'dissic', 'uice', 'bsfd', 'salinity', 'vice', 'hsnow', 'ssh', 'fice', 'btemp', 'mlp', 'hice', 'u', 'v', 'fy_age', 'temperature', 'fy_frac', 'albedo'];
const depthsAvaliable = ['0', '2', '3', '4', '5', '6', '8', '10'];
const variablesWithDepthsAvaliable = variablesAvaliable.flatMap(v => depthsAvaliable.map(d => `${v} | ${d}`));
const datesAvaliable = [...Array(12)].map((v, i) => `2020-${String(i + 1).padStart(2, '0')}-01`);
// console.log(variablesWithDepthsAvaliable)
// const generateAnimalsAvaliable = (animals) => { [...new Set(animals.map(row => row.species))]; };

// Viewport settings
const INITIAL_VIEW_STATE = {
  longitude: 20,
  latitude: 77,
  zoom: 3,
};

const calculateColor = (value: number) => {
  if (value === null) return [255, 255, 255, 0];
  const breakIndex = legend.score.breaks.findIndex(v => value < v);
  // если нет границы больше, чем выбранное значение, то берёт последний цвет (findIndex -> -1, at(-1) = last)
  return legend.score.colors.at(breakIndex);
};

const rgbToHex = (rgb: number[]): string => `#${rgb.map(v => v.toString(16).padStart(2, '0')).join('')}`;

const generateLegend = (variable: string) => {
  const variableLegend = legend[variable];
  const labels = ['не подходит'].concat(
    variableLegend.breaks.map(
      (v: number, i: number) =>
        i === 0 ?
          `менее ${variableLegend.breaks[i + 1]}` :
          variableLegend.breaks[i + 1] ?
            `от ${variableLegend.breaks[i]} до ${variableLegend.breaks[i + 1]}` :
            `более ${variableLegend.breaks[i]}`
    )
  );

  const legendItems = variableLegend.colors
    .map((v: number[], i: number) => ({ color: v, label: labels[i] }))
    .reverse();
  return (
    <Stack m="md" spacing="xs">
      <Text>{variableLegend.label}</Text>
      {legendItems.map((v: { color: number[], label: string }) => <Group spacing="xs" key={v.label}><div className="w-5 h-5 rounded-sm" style={{ backgroundColor: rgbToHex(v.color) }} /><Text fz="sm">{v.label}</Text></Group>)}
    </Stack>
  )
};

export function Hand({ avaliableTabs, activeTab, setActiveTab }) {
  const { classes, cx } = useStyles();

  const [selectedVariableWithDepth, setSelectedVariableWithDepth] =
    useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(datesAvaliable[0]);
  const [mapData, setMapData] = useState<any[]>([]);
  const [selectedAnimals, setSelectedAnimals] = useState<string[]>([]);
  const [animalsData, setAnimalsData] = useState<[] | null>([]);

  useEffect(() => {
    fetch(`http://178.154.229.47:3000/animals?select=h3,species,occurences&date=eq.${selectedDate}&order=occurences.desc`)
      .then(r => r.json())
      .then(json => setAnimalsData(json));
  }, [selectedDate]);

  const handleMultiselectVariables = (multiselectVariables: string[]) => {
    const newStateVariables = multiselectVariables;
    const oldStateVariables = selectedVariableWithDepth;
    // onChange multiselectVariables будет больше или меньше
    if (oldStateVariables.length < newStateVariables.length) {
      const addedVar = newStateVariables.find(v => !(oldStateVariables.includes(v))) as string;
      const [variable, depth] = addedVar.split(' | ');

      fetch(`http://178.154.229.47:3000/context?select=h3,value:${variable}&date=eq.${selectedDate}&depth=eq.${depth}`)
        .then(r => r.json())
        .then((json) => {
          const values = json.map((r: { h3: string, value: number }) => r.value);
          const minValue = Math.min(...values);
          const maxValue = Math.max(...values);
          const pseudoOptimum =
            [
              (minValue + maxValue) / 2 - (maxValue - minValue) / 8,
              (minValue + maxValue) / 2 + (maxValue - minValue) / 8,
            ];
          const pseudoLimit =
            [
              (minValue + maxValue) / 2 - (maxValue - minValue) / 4,
              (minValue + maxValue) / 2 + (maxValue - minValue) / 4,
            ];
          const minimumRange = (maxValue - minValue) / 50;
          const step = (maxValue - minValue) / 100;
          const newMapData = [
            ...mapData,
            {
              name: addedVar,
              date: selectedDate,
              data: json,
              min: minValue,
              max: maxValue,
              optimum: pseudoOptimum,
              limit: pseudoLimit,
              minRange: minimumRange,
              step,
            },
          ];
          setMapData(newMapData);
        });
    } else {
      const removedVar: string = oldStateVariables.find(
        v => !(multiselectVariables.includes(v))
      ) as string;
      const newMapData = mapData.filter(v => v.name !== removedVar);
      setMapData(newMapData);
    }
    setSelectedVariableWithDepth(newStateVariables);
  };

  const setOptimum = (varname: string, optimumRange: [number, number]) => (
    setMapData(
      mapData.map(
        v => v.name === varname ?
          {
            ...v,
            optimum: [
              optimumRange[0] < v.limit[0] ? v.limit[0] + v.step : optimumRange[0],
              optimumRange[1] > v.limit[1] ? v.limit[1] - v.step : optimumRange[1],
            ],
          } :
          v
      )
    )
  );

  const setLimit = (varname: string, limitRange: [number, number]) => (
    setMapData(
      mapData.map(
        v => v.name === varname ?
          {
            ...v,
            limit: [
              limitRange[0] > v.optimum[0] ? v.optimum[0] - v.step : limitRange[0],
              limitRange[1] < v.optimum[1] ? v.optimum[1] + v.step : limitRange[1],
            ],
          } :
          v
      )
    )
  );

  const sliders = mapData.map(variable => (
    <Stack key={variable.name} my="md" spacing="xs">
      <Text fz="sm" mt="xs">{variable.name}</Text>
      <RangeSlider
        name="optimum"
        color="green"
        value={variable.optimum}
        min={variable.min}
        max={variable.max}
        minRange={variable.minRange}
        step={variable.step}
        onChange={currentRange => setOptimum(variable.name, currentRange)}
        label={(value: number) => value.toFixed(2)}
      />
      <RangeSlider
        name="limit"
        color="yellow"
        value={variable.limit}
        min={variable.min}
        max={variable.max}
        minRange={variable.minRange}
        step={variable.step}
        onChange={currentRange => setLimit(variable.name, currentRange)}
        label={(value: number) => value.toFixed(2)}
      />
    </Stack>
  ));

  const tabs = avaliableTabs.map(
    (tab: { icon: FC<{ size: string, stroke: number }>, label: string }) => (
      <Tooltip
        label={tab.label}
        position="right"
        withArrow
        transitionProps={{ duration: 0 }}
        key={tab.label}
      >
        <UnstyledButton
          onClick={() => setActiveTab(tab.label)}
          className={
            cx(classes.mainLink, { [classes.mainLinkActive]: tab.label === activeTab })
          }
        >
          <tab.icon size="1.4rem" stroke={1.5} />
        </UnstyledButton>
      </Tooltip>
    )
  );

  const linearInterpolation = (value: number, optimum: number, limit: number) => (
    (100 / (optimum - limit)) * (value - limit)
  );

  const evaluateValue = (value: number, optimum: number[], limit: number[]) => (
    optimum[0] <= value && value <= optimum[1] ? 100 :
      limit[0] <= value && value < optimum[0] ?
        linearInterpolation(value, optimum[0], limit[0]) :
        optimum[1] < value && value <= limit[1] ?
          linearInterpolation(value, optimum[1], limit[1]) :
          -1000
  );

  const calculateScore = (mapdata: typeof mapData) => (
    mapdata.slice(1).reduce( // first element is the initial value
      (acc, currentVariable) => acc.map(
        (row: { h3: string, value: number }, i: number) => (
          {
            ...row,
            value:
              row.value +
              evaluateValue(
                currentVariable.data[i].value,
                currentVariable.optimum,
                currentVariable.limit
              ),
          }
        )
      ),
      mapdata[0].data.map( // initial value
        (r: { h3: string, value: number }) => (
          {
            ...r,
            value: evaluateValue(r.value, mapdata[0].optimum, mapdata[0].limit),
          }
        )
      ) // arrays of data must be equal! (needs to be configured)
    )
      .map(
        (r: { h3: string, value: number }) => (
          { ...r, value: r.value / mapdata.length < 0 ? -1 : r.value / mapdata.length }
        )
      )
  );

  console.log(mapData.length > 0 && calculateScore(mapData));

  return (
    <AppShell
      padding="md"
      navbar={
        <Navbar width={{ sm: 500 }}>{
          <Navbar.Section grow className={classes.wrapper}>
            <div className={classes.aside}>
              <div className={classes.logo}>
                {/* <MantineLogo type="mark" size={30} /> */}
              </div>
              {tabs}
            </div>
            <div className={classes.main}>
              <Title order={4} className={classes.title}>
                {activeTab}
              </Title>
              <ScrollArea m="md" type="always" h="calc(100vh - 140px)" offsetScrollbars>
                <MultiSelect
                  clearable
                  label="Вид"
                  value={selectedAnimals}
                  onChange={setSelectedAnimals}
                  data={[...new Set(animalsData.map(row => row.species))]}
                />
                <Tooltip label="Блокируется, если выбраны параметры среды">
                  <Select
                    data={datesAvaliable}
                    value={selectedDate}
                    onChange={setSelectedDate}
                    disabled={selectedVariableWithDepth.length > 0}
                    label="Месяц"
                  />
                </Tooltip>

                <MultiSelect
                  data={variablesWithDepthsAvaliable}
                  value={selectedVariableWithDepth}
                  onChange={handleMultiselectVariables}
                  label="Параметры среды"
                />

                {sliders}

                <Divider my="xl" />
                <Title order={6}>
                  Легенда
                </Title>
                {generateLegend('score')}
              </ScrollArea>
            </div>
          </Navbar.Section>
        }
        </Navbar>
      }
      header={<Header height={60} p="xs">{/* Header content */}</Header>}
      styles={(theme) => ({
        main: { backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0] },
      })}
    >
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller
      >
        <Map
          mapLib={maplibregl}
          mapStyle={mapstyle}
        />
        <H3HexagonLayer
          id="hexagons-context"
          data={mapData.length > 0 && calculateScore(mapData)}
          filled
          pickable
          getHexagon={e => e.h3}
          getFillColor={e => calculateColor(e.value)}
        />
        <H3HexagonLayer
          id="hexagons-animals"
          data={animalsData.filter(row => selectedAnimals.includes(row.species))}
          pickable
          getHexagon={e => e.h3}
          getFillColor={[255, 0, 0, 50]}
        />
      </DeckGL>
    </AppShell>

  );
}

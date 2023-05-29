// @ts-nocheck
import { useState, useEffect, FC } from 'react';
import DeckGL from '@deck.gl/react/typed';
import { H3HexagonLayer } from '@deck.gl/geo-layers/typed';
import { Map } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import { createStyles, AppShell, Navbar, Header, UnstyledButton, Tooltip, Title, Text, Select, MultiSelect, Stack, Group, Divider, ScrollArea, rem } from '@mantine/core';

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
const datesAvaliable = [...Array(12)].map((v, i) => `2020-${String(i + 1).padStart(2, '0')}-01`);
const depthsAvaliable = ['0', '2', '3', '4', '5', '6', '8', '10'];
// const generateAnimalsAvaliable = (animals) => { [...new Set(animals.map(row => row.species))]; };

// Viewport settings
const INITIAL_VIEW_STATE = {
  longitude: 20,
  latitude: 77,
  zoom: 3,
};

const calculateColor = (row) => {
  const currentVariable = Object.keys(row)[1];
  const currentValue = row[currentVariable];
  if (currentValue === null) return [255, 255, 255, 0];
  const breakIndex = legend[currentVariable].breaks.findIndex((v: number) => currentValue < v);

  return legend[currentVariable].colors.at(breakIndex);
};

const rgbToHex = (rgb: number[]): string => `#${rgb.map(v => v.toString(16).padStart(2, '0')).join('')}`;

const generateLegend = (variable: string) => {
  const variableLegend = legend[variable];
  const labels = [`менее ${variableLegend.breaks[0]}`].concat(variableLegend.breaks.map((v, i) => variableLegend.breaks[i + 1] ? `от ${variableLegend.breaks[i]} до ${variableLegend.breaks[i + 1]}` : `более ${variableLegend.breaks[i]}`));
  const legendItems = variableLegend.colors
    .map((v, i) => ({ color: v, label: labels[i] }))
    .reverse();
  return (
    <Stack spacing="xs">
      <Text>{variableLegend.label}</Text>
      {legendItems.map((v: { color: number[], label: string }) => <Group spacing="xs" key={v.label}><div className="w-5 h-5 rounded-sm" style={{ backgroundColor: rgbToHex(v.color) }} /><Text fz="sm">{v.label}</Text></Group>)}
    </Stack>
  );
};

export function Viewer({ avaliableTabs, activeTab, setActiveTab }) {
  const { classes, cx } = useStyles();
  const [selectedVariable, setSelectedVariable] = useState<string | null>(variablesAvaliable[0]);
  const [selectedDate, setSelectedDate] = useState<string | null>(datesAvaliable[0]);
  const [selectedDepth, setSelectedDepth] = useState<string | null>(depthsAvaliable[0]);
  const [selectedAnimals, setSelectedAnimals] = useState<Array<string>>([]);

  const [variableData, setVariableData] = useState<Array<any> | null>();
  const [animalsData, setAnimalsData] = useState<Array<any> | null>([]);

  // const [groupByGenus, setGroupByGenus] = useState(false);

  useEffect(() => {
    fetch(`http://178.154.229.47:3000/context?select=h3,${selectedVariable}&date=eq.${selectedDate}&depth=eq.${selectedDepth}`)
      .then(r => r.json())
      .then(json => setVariableData(json));
  }, [selectedVariable, selectedDate, selectedDepth]);
  // console.log(variableData);

  useEffect(() => {
    fetch(`http://178.154.229.47:3000/animals?select=h3,species,occurences&date=eq.${selectedDate}&order=occurences.desc`)
      .then(r => r.json())
      .then(json => setAnimalsData(json));
  }, [selectedDate]);
  // console.log(animalsData);

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

  // const navbarPanel = linksMockdata.map((link) => (
  //   <a
  //     className={cx(classes.link, { [classes.linkActive]: activeLink === link })}
  //     href="/"
  //     onClick={(event) => {
  //       event.preventDefault();
  //       setActiveLink(link);
  //     }}
  //     key={link}
  //   >
  //     {link}
  //   </a>
  // ));

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
              <ScrollArea m="md" type="always" h="calc(100vh - 140px)">
                <Title order={6}>
                  Параметры среды
                </Title>
                <Select
                  data={variablesAvaliable}
                  value={selectedVariable}
                  onChange={setSelectedVariable}
                  label="Показатель"
                />
                <Select
                  data={datesAvaliable}
                  value={selectedDate}
                  onChange={setSelectedDate}
                  label="Месяц"
                />
                <Select
                  data={depthsAvaliable}
                  value={selectedDepth}
                  onChange={setSelectedDepth}
                  label="Глубина"
                />

                <Divider my="xl" />
                <Title order={6}>
                  Животные
                </Title>

                {/* <Switch
                checked={groupByGenus}
                onChange={(event) => setGroupByGenus(event.currentTarget.checked)}
                labelPosition="left"
                label="Сгруппировать по родам"
              /> */}
                <MultiSelect
                  clearable
                  label="Вид"
                  value={selectedAnimals}
                  onChange={setSelectedAnimals}
                  data={[...new Set(animalsData.map(row => row.species))]}
                />

                <Divider my="xl" />
                <Title order={6}>
                  Легенда
                </Title>
                {generateLegend(selectedVariable)}
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
          data={variableData}
          filled
          pickable
          getHexagon={e => e.h3}
          getFillColor={e => calculateColor(e)}
          stroked
          getLineWidth={1}
          getLineColor={[255, 255, 255]}
          lineWidthUnits="pixels"
          extruded={false}
        />
        <H3HexagonLayer
          id="hexagons-animals"
          data={animalsData.filter(row => selectedAnimals.includes(row.species))}
          pickable
          getHexagon={e => e.h3}
          getFillColor={[255, 0, 0, 50]}
        />
        <H3HexagonLayer
          id="hexagons-example"
          data="https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/sf.h3cells.json"
          // filled
          // stroked
          getHexagon={e => e.hex}
          // getFillColor={[255, 0, 0, 50]}
          // getLineColor={[0, 0, 0, 255]}
          // getLineWidth={10}
        />
      </DeckGL>
    </AppShell>

  );
}

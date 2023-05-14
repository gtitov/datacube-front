import { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react/typed';
import { H3HexagonLayer } from '@deck.gl/geo-layers/typed';
import { Map } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import { createStyles, AppShell, Navbar, Header, UnstyledButton, Tooltip, Title, Text, Select, MultiSelect, Stack, Group, Divider, ScrollArea, rem } from '@mantine/core';

import {
  IconEyeglass,
  IconDeviceDesktopAnalytics,
  IconTopologyStar3,
} from '@tabler/icons-react';

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

const mainLinksData = [
  { icon: IconEyeglass, label: 'Просмотр' },
  { icon: IconDeviceDesktopAnalytics, label: 'Ручная оценка' },
  { icon: IconTopologyStar3, label: 'Машинная оценка' },
];

const variablesAvaliable = ['o2', 'spco2', 'chl'];
const datesAvaliable = [...Array(12)].map((v, i) => `2020-${String(i + 1).padStart(2, '0')}-01`);
const depthsAvaliable = ['0', '2', '5'];
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
  const thesholdValues = legend[currentVariable].values;
  const thesholdIndex = thesholdValues.findIndex(v => currentValue < v);

  return legend[currentVariable].colors.at(thesholdIndex);
};

const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
  const hex = x.toString(16)
  return hex.length === 1 ? '0' + hex : hex
}).join('')

const generateLegend = (variable) => {
  const variableLegend = legend[variable];
  const labels = [`менее ${variableLegend.values[0]}`].concat(variableLegend.values.map((v, i) => variableLegend.values[i + 1] ? `от ${variableLegend.values[i]} до ${variableLegend.values[i + 1]}` : `более ${variableLegend.values[i]}`));
  const legendItems = variableLegend.colors
    .map((v, i) => ({ color: v, label: labels[i] }))
    .reverse();
  return (
    <Stack m="md" spacing="xs">
      <Text>{variableLegend.label}</Text>
      {legendItems.map(v => <Group spacing="xs" key={v.label}><div className="w-5 h-5 rounded-sm" style={{ backgroundColor: rgbToHex(...v.color) }} /><Text fz="sm">{v.label}</Text></Group>)}
    </Stack>
  )
};

export function DoubleNavbar() {
  const { classes, cx } = useStyles();
  const [activeMainLink, setActiveMainLink] = useState('Просмотр');
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
  console.log(variableData);

  useEffect(() => {
    fetch(`http://178.154.229.47:3000/animals?select=h3,species,occurences&date=eq.${selectedDate}&order=occurences.desc`)
      .then(r => r.json())
      .then(json => setAnimalsData(json));
  }, [selectedDate]);
  console.log(animalsData);

  const mainLinks = mainLinksData.map((link) => (
    <Tooltip
      label={link.label}
      position="right"
      withArrow
      transitionProps={{ duration: 0 }}
      key={link.label}
    >
      <UnstyledButton
        onClick={() => setActiveMainLink(link.label)}
        className={
          cx(classes.mainLink, { [classes.mainLinkActive]: link.label === activeMainLink })
        }
      >
        <link.icon size="1.4rem" stroke={1.5} />
      </UnstyledButton>
    </Tooltip>
  ));

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
        <Navbar height="100vh" width={{ sm: 500 }}>{
          <Navbar.Section grow className={classes.wrapper}>
            <div className={classes.aside}>
              <div className={classes.logo}>
                {/* <MantineLogo type="mark" size={30} /> */}
              </div>
              {mainLinks}
            </div>
            <div className={classes.main}>
              <Title order={4} className={classes.title}>
                {activeMainLink}
              </Title>
              <ScrollArea type="always" h="100%">
                <Title m="md" order={6}>
                  Параметры среды
                </Title>
                <Select
                  m="md"
                  data={variablesAvaliable}
                  value={selectedVariable}
                  onChange={setSelectedVariable}
                  label="Показатель"
                />
                <Select
                  m="md"
                  data={datesAvaliable}
                  value={selectedDate}
                  onChange={setSelectedDate}
                  label="Месяц"
                />
                <Select
                  m="md"
                  data={depthsAvaliable}
                  value={selectedDepth}
                  onChange={setSelectedDepth}
                  label="Глубина"
                />

                <Divider my="xl" />
                <Title m="md" order={6}>
                  Животные
                </Title>

                {/* <Switch
                m="md"
                checked={groupByGenus}
                onChange={(event) => setGroupByGenus(event.currentTarget.checked)}
                labelPosition="left"
                label="Сгруппировать по родам"
              /> */}
                <MultiSelect
                  clearable
                  m="md"
                  label="Вид"
                  value={selectedAnimals}
                  onChange={setSelectedAnimals}
                  data={[...new Set(animalsData.map(row => row.species))]}
                />

                <Divider my="xl" />
                <Title m="md" order={6}>
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

import { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react/typed';
import { H3HexagonLayer } from '@deck.gl/geo-layers/typed';
import { Map } from 'react-map-gl';
import { createStyles, AppShell, Navbar, Header, UnstyledButton, Tooltip, Title, Select, MultiSelect, Switch, Divider, rem } from '@mantine/core';

import {
  IconEyeglass,
  IconDeviceDesktopAnalytics,
  IconTopologyStar3,
} from '@tabler/icons-react';

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

// Viewport settings
const INITIAL_VIEW_STATE = {
  longitude: 40.41669,
  latitude: 80.7853,
  zoom: 2,
  pitch: 0,
  bearing: 0,
};

export function DoubleNavbar() {
  const { classes, cx } = useStyles();
  const [activeMainLink, setActiveMainLink] = useState('Просмотр');
  const [selectedVariable, setSelectedVariable] = useState<string | null>(variablesAvaliable[0]);
  const [selectedDate, setSelectedDate] = useState<string | null>(datesAvaliable[0]);
  const [selectedDepth, setSelectedDepth] = useState<string | null>(depthsAvaliable[0]);
  const [mapData, setMapData] = useState();

  // async function logJSONData(variable, date, depth) {
  //   const response = await fetch(`http://178.154.229.47:3000/context?select=h3,${variable}&date=eq.${date}&depth=eq.${depth}`);
  //   const jsonData = await response.json();
  //   return jsonData;
  // }

  useEffect(() => {
    fetch(`http://178.154.229.47:3000/context?select=h3,${selectedVariable}&date=eq.${selectedDate}&depth=eq.${selectedDepth}`)
      .then(r => r.json())
      .then(json => setMapData(json));
  }, [selectedVariable, selectedDate, selectedDepth]);

  // const mapData = logJSONData(selectedVariable, selectedDate, selectedDepth);
  // const mapData = fetch(`http://178.154.229.47:3000/context?select=h3,${selectedVariable}&date=eq.${selectedDate}&depth=eq.${selectedDepth}`)
  //   .then(r => r.json())
  //   .then(json => json);
  console.log(mapData);

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
              <Title m="md" order={6}>
                Параметры среды
              </Title>
              <Select
                m="md"
                data={variablesAvaliable}
                value={selectedVariable}
                onChange={setSelectedVariable}
              />
              <Select
                m="md"
                data={datesAvaliable}
                value={selectedDate}
                onChange={setSelectedDate}
              />
              <Select
                m="md"
                data={depthsAvaliable}
                value={selectedDepth}
                onChange={setSelectedDepth}
              />

              <Divider my="xl" />
              <Title m="md" order={6}>
                Животные
              </Title>

              <Switch
                m="md"
                labelPosition="left"
                label="Сгруппировать по родам"
              />
              <MultiSelect
                m="md"
                data={depthsAvaliable}
              />
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
      {
        <DeckGL
          initialViewState={INITIAL_VIEW_STATE}
          controller
        >
          {/* <Map mapboxAccessToken="pk.eyJ1IjoiZ2hlcm1hbnQiLCJhIjoiY2pncDUwcnRmNDQ4ZjJ4czdjZXMzaHZpNyJ9.3rFyYRRtvLUngHm027HZ7A" /> */}
          <H3HexagonLayer
            id="hexagons-context"
            data={mapData}
            filled
            pickable
            getHexagon={e => e.h3}
            getFillColor={e => [0, e[selectedVariable] * 10 - 100, 200]}
          />
        </DeckGL>
        // <DeckGL
        //   controller
        //   initialViewState={{
        //     longitude: -122.41669,
        //     latitude: 37.7853,
        //     zoom: 2,
        //     pitch: 0,
        //     bearing: 0,
        //   }}
        // >
        //   {/* <H3HexagonLayer
        //   id="hexagons"
        //   data={mapData}
        //   filled
        //   pickable
        //   getHexagons={e => e.h3}
        //   getFillColor={[0, 128, 200]}
        // /> */}
        //   <Map mapboxAccessToken="pk.eyJ1IjoiZ2hlcm1hbnQiLCJhIjoiY2pncDUwcnRmNDQ4ZjJ4czdjZXMzaHZpNyJ9.3rFyYRRtvLUngHm027HZ7A" />
        // </DeckGL>
      }
    </AppShell>

  );
}

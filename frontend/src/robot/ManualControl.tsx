import React from "react";
import {
  Box,
  Button,
  Collapse,
  FormControlLabel,
  Grid,
  LinearProgress,
  Stack,
  Switch,
  Typography,
  styled,
} from "@mui/material";
import {
  Capability,
  ManualControlCommand,
  useManualControlInteraction,
  useManualControlPropertiesQuery,
  useManualControlStateQuery,
} from "../api";
import { useCapabilitiesSupported } from "../CapabilitiesProvider";
import { FullHeightGrid } from "../components/FullHeightGrid";
import {
  ArrowDownward as ArrowDownwardIcon,
  ArrowUpward as ArrowUpwardIcon,
  RotateLeft as RotateLeftIcon,
  RotateRight as RotateRightIcon,
} from "@mui/icons-material";
import PaperContainer from "../components/PaperContainer";
import  {GamePadListener}  from "./GamePadListener";

const SideButton = styled(Button)({
  width: "30%",
  height: "100%",
});

const CenterButton = styled(Button)({
  width: "100%",
});

const ManualControlInternal: React.FunctionComponent = (): JSX.Element => {
  const {
    data: manualControlState,
    isLoading: manualControlStateLoading,
    isError: manualControlStateError,
  } = useManualControlStateQuery();

  const {
    data: manualControlProperties,
    isLoading: manualControlPropertiesLoading,
    isError: manualControlPropertiesError,
  } = useManualControlPropertiesQuery();

  const { mutate: sendInteraction, isLoading: interacting } =
    useManualControlInteraction();

  const loading = manualControlPropertiesLoading || manualControlStateLoading;

  const controls = React.useMemo(() => {
    if (
      manualControlPropertiesError ||
      manualControlStateError ||
      !manualControlProperties ||
      !manualControlState
    ) {
      return (
        <Typography color="error">Error loading manual controls</Typography>
      );
    }

    const controlsEnabled =
      !loading && manualControlState.enabled && !interacting;
    const forwardEnabled =
      controlsEnabled &&
      manualControlProperties.supportedMovementCommands.includes("forward");
    const backwardEnabled =
      controlsEnabled &&
      manualControlProperties.supportedMovementCommands.includes("backward");
    const rotateCwEnabled =
      controlsEnabled &&
      manualControlProperties.supportedMovementCommands.includes(
        "rotate_clockwise"
      );
    const rotateCcwEnabled =
      controlsEnabled &&
      manualControlProperties.supportedMovementCommands.includes(
        "rotate_counterclockwise"
      );

    const sendMoveCommand = (command: ManualControlCommand): void => {
      sendInteraction({
        action: "move",
        movementCommand: command,
      });
    };

    const gamePadListener = new GamePadListener();


    const enableManualControl = (): void => {
      // start gamepad listener
      gamePadListener.init();
      sendInteraction({ action: "enable" });
    };

    const disableManualControl = (): void => {
      // kill gamepad listener
      gamePadListener.dispose();

      sendInteraction({ action: "disable" });
    };

    return (
      <>
        <FormControlLabel
          control={
            <Switch
              checked={manualControlState.enabled}
              disabled={loading || interacting}
              onChange={(e) => {
                if (e.target.checked) {
                  enableManualControl();
                } else {
                  disableManualControl();
                }
                
              }}
            />
          }
          label="Enable manual control"
          style={{ marginLeft: 0 }}
        />
        <Box />

        <Stack
          direction="row"
          sx={{ width: "100%", height: "30vh" }}
          justifyContent="center"
          alignItems="center"
        >
          <SideButton
            variant="outlined"
            disabled={!rotateCcwEnabled}
            onClick={() => {
              sendMoveCommand("rotate_counterclockwise");
            }}
          >
            <RotateLeftIcon />
          </SideButton>
          <Stack
            sx={{ width: "40%", height: "100%", ml: 1, mr: 1 }}
            justifyContent="space-between"
          >
            <CenterButton
              sx={{ height: "65%" }}
              variant="outlined"
              disabled={!forwardEnabled}
              onClick={() => {
                sendMoveCommand("forward");
              }}
            >
              <ArrowUpwardIcon />
            </CenterButton>
            <CenterButton
              sx={{ height: "30%" }}
              variant="outlined"
              disabled={!backwardEnabled}
              onClick={() => {
                sendMoveCommand("backward");
              }}
            >
              <ArrowDownwardIcon />
            </CenterButton>
          </Stack>
          <SideButton
            variant="outlined"
            disabled={!rotateCwEnabled}
            onClick={() => {
              sendMoveCommand("rotate_clockwise");
            }}
          >
            <RotateRightIcon />
          </SideButton>
        </Stack>
      </>
    );
  }, [
    loading,
    manualControlProperties,
    manualControlPropertiesError,
    manualControlState,
    manualControlStateError,
    sendInteraction,
    interacting,
  ]);

  return React.useMemo(() => {
    return (
      <FullHeightGrid container direction="column">
        <Grid item flexGrow={1}>
          <Box>
            <Collapse in={loading}>
              <LinearProgress />
            </Collapse>
            {controls}
          </Box>
        </Grid>
      </FullHeightGrid>
    );
  }, [loading, controls]);
};

const ManualControl = (): JSX.Element => {
  const [supported] = useCapabilitiesSupported(Capability.ManualControl);

  return (
    <PaperContainer>
      {supported ? (
        <ManualControlInternal />
      ) : (
        <Typography color="error">
          This robot does not support the manual control.
        </Typography>
      )}
    </PaperContainer>
  );
};

export default ManualControl;

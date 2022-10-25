/**
 *  OpenAI GPT-3 Text Generator (Chrome extension)
 *
 * (c) 2022 Mark Kretschmann <kretschmann@kde.org>
 *
 */
import SettingsIcon from "@mui/icons-material/Settings";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Modal from "@mui/material/Modal";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { Storage } from "@plasmohq/storage";

const GENERATE_BUTTON_TEXT = "Generate (Ctrl+Enter)"

let selection = ""

/**
 * Returns the selected text.
 * Note: This is executed in the context of the active tab.
 * @return {string} The selected text
 */
function getTextSelection(): string {
  return window.getSelection().toString()
}

function IndexPopup(): JSX.Element {
  const [prompt, setPrompt] = useState("")
  const [buttonText, setButtonText] = useState(GENERATE_BUTTON_TEXT)
  const [result, setResult] = useState("")
  const [error, setError] = useState("")
  const [temperature, setTemperature] = useState(0.5)

  const storage = new Storage()

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const activeTab = tabs[0]

    chrome.scripting.executeScript(
      {
        target: { tabId: activeTab.id, allFrames: true },
        func: getTextSelection
      },
      (injectionResults) => {
        for (let result of injectionResults) {
          if (
            result.result !== "" &&
            result.result !== undefined &&
            result.result !== selection
          ) {
            selection = result.result as string
            console.log("Selected text: " + selection)
            setPrompt("{SELECTION}")
          }
        }
      }
    )
  })

  const DEFAULT_OPENAI_PARAMS = {
    max_tokens: 256,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0
  }

  // Generate a prompt using OpenAI's GPT-3 API
  async function createCompletion() {
    const params = {
      ...DEFAULT_OPENAI_PARAMS,
      ...{ prompt: prompt.replaceAll("{SELECTION}", selection) },
      ...{ temperature: temperature },
      ...{ model: await storage.get("openai_model") }
    }
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + (await storage.get("openai_key"))
      },
      body: JSON.stringify(params)
    }
    console.log(params)
    // console.log(requestOptions);

    setButtonText("Generating...")
    const response = await fetch(
      "https://api.openai.com/v1/completions",
      requestOptions
    )
    setButtonText(GENERATE_BUTTON_TEXT)

    const responseJson = await response.json()
    // Check for errors
    if (responseJson.error) {
      setError(responseJson.error)
      return
    }

    const filteredText = responseJson.choices[0].text
      .split(/\r?\n/) // Split input text into an array of lines
      .filter((line) => line.trim() !== "") // Filter out lines that are empty or contain only whitespace
      .join("\n") // Join line array into a string

    setResult(filteredText)
  }

  const handleTemperatureChange = (
    event: Event,
    newValue: number | number[]
  ) => {
    setTemperature(newValue as number)
  }

  /**
   * Evaluate code in sandboxed iframe.
   * @param {string} code The code to evaluate
   */
  function evalInSandbox(code: string): void {
    const iframe = document.getElementById("sandbox") as HTMLIFrameElement
    window.addEventListener("message", (event) => {
      console.log("EVAL output: " + event.data)
    })
    iframe.contentWindow.postMessage(code, "*")
  }

  return (
    <Stack
      direction="column"
      minWidth={550}
      spacing={2}
      justifyContent="flex-start">
      <Modal open={error !== ""} onClose={() => setError("")}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 300,
            bgcolor: "background.paper",
            border: "2px solid #000",
            boxShadow: 24,
            p: 4
          }}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Error: Please check your API key
          </Typography>
        </Box>
      </Modal>

      <Stack direction="row" justifyContent="space-between">
        <Typography variant="h5">AI Companion</Typography>

        <IconButton onClick={() => chrome.runtime.openOptionsPage()}>
          <Tooltip title="Settings">
            <SettingsIcon />
          </Tooltip>
        </IconButton>
      </Stack>

      <TextField
        label="Prompt"
        multiline
        autoFocus
        minRows={2}
        onChange={(e) => setPrompt(e.target.value)}
        value={prompt}
        onKeyDown={(e) => {
          if (e.getModifierState("Control") && e.key === "Enter") {
            createCompletion()
          }
          if (e.getModifierState("Control") && e.key === "c") {
            navigator.clipboard.writeText(result) // Copy to clipboard
          }
        }}
      />

      <TextField
        label={
          selection === ""
            ? "Selected Text (None)"
            : "Selected Text {SELECTION}"
        }
        multiline
        disabled
        InputProps={{ readOnly: true }}
        value={selection}
        minRows={1}
      />

      <Stack direction="row" spacing={2} justifyContent="flex-start">
        <Typography variant="subtitle2">Temperature:</Typography>

        <Slider
          size="small"
          step={0.1}
          min={0.0}
          max={1.0}
          marks
          valueLabelDisplay="auto"
          defaultValue={temperature}
          onChange={handleTemperatureChange}
        />
      </Stack>

      <Button variant="contained" onClick={createCompletion}>
        {buttonText}
      </Button>

      <Divider />

      <TextField
        label="Result (Ctrl+C➔Clipboard)"
        multiline
        InputProps={{ readOnly: true }}
        value={result}
        minRows={7}
      />

      <iframe
        src="up_/sandbox.html"
        id="sandbox"
        style={{ display: "none" }}></iframe>
    </Stack>
  )
}

export default IndexPopup

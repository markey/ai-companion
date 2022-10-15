// OpenAI GPT-3 Text Generator (Chrome extension)
import Button from "@mui/material/Button"
import Divider from "@mui/material/Divider"
import Input from "@mui/material/Input"
import Slider from "@mui/material/Slider"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"
import { useState } from "react"

import { Storage } from "@plasmohq/storage"

const GENERATE_BUTTON_TEXT = "Generate (Ctrl+Enter)"

let selection = ""

function IndexPopup() {
  const [prompt, setPrompt] = useState("")
  const [buttonText, setButtonText] = useState(GENERATE_BUTTON_TEXT)
  const [result, setResult] = useState("")
  const [temperature, setTemperature] = useState(0.5)

  const storage = new Storage()

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const activeTab = tabs[0]

    chrome.scripting.executeScript(
      {
        target: { tabId: activeTab.id, allFrames: true },
        files: ["get-selection.js"]
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
    model: "text-davinci-002",
    max_tokens: 256,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0
  }

  // Generate a prompt using OpenAI's GPT-3 API
  const createCompletion = async () => {
    const params = {
      ...DEFAULT_OPENAI_PARAMS,
      ...{ prompt: prompt.replaceAll("{SELECTION}", selection) },
      ...{ temperature: temperature }
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

  return (
    <Stack
      direction="column"
      minWidth={450}
      spacing={2}
      justifyContent="flex-start">
      <Typography variant="h5">OpenAI Text Generator</Typography>

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
        label={selection === "" ? "Selected Text (None)" : "Selected Text {SELECTION}"}
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
        minRows={6}
      />
    </Stack>
  )
}

export default IndexPopup

/**
 *  OpenAI GPT-3 Text Generator (Chrome extension)
 *
 * (c) 2022 Mark Kretschmann <kretschmann@kde.org>
 *
 */
import DeleteIcon from "@mui/icons-material/Delete"
import HistoryIcon from "@mui/icons-material/History"
import SettingsIcon from "@mui/icons-material/Settings"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Divider from "@mui/material/Divider"
import IconButton from "@mui/material/IconButton"
import List from "@mui/material/List"
import ListItemButton from "@mui/material/ListItemButton"
import ListItemText from "@mui/material/ListItemText"
import Modal from "@mui/material/Modal"
import Slider from "@mui/material/Slider"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"
import { useState } from "react"

import { useStorage } from "@plasmohq/storage/hook"

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
  const [openHistory, setOpenHistory] = useState(false)
  const handleOpenHistory = () => setOpenHistory(true)
  const handleCloseHistory = () => setOpenHistory(false)
  const [prompt, setPrompt] = useState("")
  const [buttonText, setButtonText] = useState("Generate (Ctrl+Enter)")
  const [result, setResult] = useState("")
  const [error, setError] = useState("")

  const [temperature, setTemperature] = useStorage(
    "openai_temperature",
    async (v) => (v === undefined ? 0.0 : v)
  )
  const [history, setHistory] = useStorage("openai_history", async (v) =>
    v === undefined ? [] : v
  )
  const [key, setKey] = useStorage("openai_key")
  const [maxTokens, setMaxTokens] = useStorage("openai_max_tokens")
  const [model, setModel] = useStorage("openai_model")

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

  // Generate a prompt using OpenAI's GPT-3 API
  async function createCompletion() {
    const params = {
      prompt: prompt.replaceAll("{SELECTION}", selection),
      temperature: temperature,
      max_tokens: maxTokens,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      model: model
    }
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + key
      },
      body: JSON.stringify(params)
    }

    const oldButtonText = buttonText
    setButtonText("Generating...")
    const response = await fetch(
      "https://api.openai.com/v1/completions",
      requestOptions
    )
    setButtonText(oldButtonText)

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

    // Add to history
    const newHistory = [filteredText, ...history]
    setHistory(newHistory)
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

  const handleTemperatureChange = (
    event: Event,
    newValue: number | number[]
  ) => {
    setTemperature(newValue as number)
  }

  return (
    <Stack
      direction="column"
      minWidth={550}
      spacing={2}
      justifyContent="flex-start">
      {/* Error modal */}
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

      {/* History modal with vertical scrolling and clickable items */}
      <Modal open={openHistory} onClose={handleCloseHistory}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 500,
            bgcolor: "background.paper",
            border: "2px solid #000",
            boxShadow: 24,
            p: 4
          }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography id="modal-modal-title" variant="h6" component="h2">
              History
            </Typography>
            <IconButton onClick={setHistory.bind(null, [])}>
              <Tooltip title="Clear history">
                <DeleteIcon />
              </Tooltip>
            </IconButton>
          </Stack>
          <Divider />
          <Box sx={{ overflowY: "scroll", height: 400 }}>
            <List>
              {history && history.length > 0 ? ( // If history exists and is not empty
                history.map((item, index) => (
                  // If item is clicked copy item to prompt and close the modal
                  <ListItemButton
                    key={index}
                    onClick={() => {
                      setPrompt(item)
                      handleCloseHistory()
                    }}>
                    <ListItemText primary={index + 1 + ". " + item} />
                  </ListItemButton>
                ))
              ) : (
                <ListItemButton>
                  <ListItemText primary="<empty>" />
                </ListItemButton>
              )}
            </List>
          </Box>
        </Box>
      </Modal>

      <Stack direction="row" justifyContent="space-between">
        <Typography variant="h5">AI Companion</Typography>

        <Stack direction="row" spacing={1}>
          {/* History button */}
          <IconButton onClick={() => handleOpenHistory()}>
            <Tooltip title="History">
              <HistoryIcon />
            </Tooltip>
          </IconButton>

          {/* Settings button */}
          <IconButton onClick={() => chrome.runtime.openOptionsPage()}>
            <Tooltip title="Settings">
              <SettingsIcon />
            </Tooltip>
          </IconButton>
        </Stack>
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
          value={temperature}
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

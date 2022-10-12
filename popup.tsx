// OpenAI GPT-3 Prompt Generator (Chrome extension)

import Button from "@mui/material/Button"
import Input from "@mui/material/Input"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { useState } from "react"
import { Storage } from "@plasmohq/storage"
import { TextField } from "@mui/material"

let selection;

function IndexPopup() {
  const [data, setData] = useState("");
  const [buttonText, setButtonText] = useState("Generate Prompt");
  const [result, setResult] = useState("");
  const storage = new Storage();

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    let tab = tabs[0];
    console.log("Active Tab: " + tab.id);

    chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      files: ["get-selection.js"],
    },
      (injectionResults) => {
        for (let result of injectionResults) {
          if (result.result !== "" && result.result !== undefined && result.result !== selection) {
            selection = result.result;
            console.log("Selected text: " + selection);
            setData(selection);
          }
        }
      });
  });

  const DEFAULT_PARAMS = {
    "model": "text-davinci-002",
    "temperature": 0.7,
    "max_tokens": 256,
    "top_p": 1,
    "frequency_penalty": 0,
    "presence_penalty": 0
  }

  const createCompletion = async () => {
    const params_ = { ...DEFAULT_PARAMS, ...{ "prompt": data } };
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + await storage.get("openai_key"),
      },
      body: JSON.stringify(params_)
    };
    console.log(params_);
    // console.log(requestOptions);

    setButtonText("Generating...");
    const response = await fetch('https://api.openai.com/v1/completions', requestOptions);
    const data1 = await response.json();
    setButtonText("Generate Prompt");

    console.log(data1.choices[0].text);
    setResult(data1.choices[0].text);
    return data1.choices[0].text;
  }

  return (
    <Stack minWidth={400} spacing={2}>

      <Typography variant="h5">
        Enter text to send to OpenAI
      </Typography>

      <TextField label="Prompt" multiline autoFocus minRows={3}
        onChange={(e) => setData(e.target.value)} value={data}
        onKeyDown={(e) => {
          if (e.getModifierState("Control") &&
            e.key === "Enter") createCompletion()
        }}
      />

      <Button variant="contained" onClick={createCompletion}>{buttonText}</Button>

      <TextField label="Result" disabled multiline InputProps={{ readOnly: true }} value={result} minRows={6} />

    </Stack>
  )
}

export default IndexPopup

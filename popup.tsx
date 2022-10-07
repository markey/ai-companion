// OpenAI GPT-3 Prompt Generator Chrome extension

import { useState } from "react"
import { Storage } from "@plasmohq/storage"
import { Configuration, OpenAIApi } from "openai";


function IndexPopup() {
  console.log("Popup.tsx");

  const [data, setData] = useState("")
  const storage = new Storage();

  const configuration = new Configuration({
    apiKey: storage.get("openai_key"),
  });
  const openai = new OpenAIApi(configuration);
  
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 16
      }}>

      <h2>
        Enter text to send to OpenAI:
      </h2>

      <input onChange={(e) => setData(e.target.value)} value={data} />

      <button onClick={ async () => { 
        await openai.createCompletion({
          model: "text-davinci-002",
          prompt: data,
        }).then((response) => { console.log("OpenAI response: ", response) })
      }}>Send to OpenAI</button>

      <button onClick={(e) => { console.log("CLICK") }}>Log to console</button>

      </div>
  )
}

export default IndexPopup

// import { useState } from "react"
import { useStorage } from "@plasmohq/storage/hook"


function OptionsIndex() {
  // const [data, setData] = useState("")
  const [key, setKey] = useStorage("openai_key")

  return (
    <div>
      <h1>
        Welcome to your <a href="https://www.plasmo.com">Plasmo</a> Extension!
      </h1>
      <h2>Enter OpenAI key:</h2>
      {/* <input onChange={(e) => setData(e.target.value)} value={data} /> */}
      <input onChange={(e) => setKey(e.target.value)} value={key} />
      </div>
  )
}

export default OptionsIndex

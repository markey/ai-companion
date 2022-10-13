import Button from "@mui/material/Button"
import Divider from "@mui/material/Divider"
import Input from "@mui/material/Input"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"

import { useStorage } from "@plasmohq/storage/hook"

function OptionsIndex() {
  // const [data, setData] = useState("")
  const [key, setKey] = useStorage("openai_key")

  return (
    <Stack maxWidth={600} spacing={2}>
      <Typography variant="h5">OpenAI Extension Options</Typography>

      <TextField
        label="Enter OpenAI key"
        autoFocus
        onChange={(e) => setKey(e.target.value)}
        value={key}
      />
    </Stack>
  )
}

export default OptionsIndex

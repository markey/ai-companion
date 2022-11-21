/**
 *  OpenAI GPT-3 Text Generator (Chrome extension)
 *
 * (c) 2022 Mark Kretschmann <kretschmann@kde.org>
 *
 */
import Button from "@mui/material/Button"
import Divider from "@mui/material/Divider"
import FormControl from "@mui/material/FormControl"
import Input from "@mui/material/Input"
import InputLabel from "@mui/material/InputLabel"
import MenuItem from "@mui/material/MenuItem"
import Select from "@mui/material/Select"
import Slider from "@mui/material/Slider"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"

import { useStorage } from "@plasmohq/storage/hook"

function OptionsIndex() {
  const [key, setKey] = useStorage("openai_key")
  const [model, setModel] = useStorage("openai_model", async (v) =>
    v === undefined ? "text-davinci-002" : v
  )
  const [maxTokens, setMaxTokens] = useStorage("openai_max_tokens", async (v) =>
    v === undefined ? 256 : v
  )

  const handleMaxTokensChange = (event: any, newValue: number | number[]) => {
    setMaxTokens(newValue as number)
  }

  return (
    <Stack maxWidth={600} spacing={2}>
      <Typography variant="h5">OpenAI Extension Options</Typography>

      <TextField
        label="OpenAI API key"
        autoFocus
        onChange={(e) => setKey(e.target.value)}
        value={key}
      />
      <FormControl>
        <InputLabel id="model-select-label">Model</InputLabel>
        <Select
          labelId="model-select-label"
          label="Model"
          value={model}
          onChange={(e) => setModel(e.target.value)}>
          <MenuItem value="code-davinci-002">code-davinci-002</MenuItem>
          <MenuItem value="text-curie-001">text-curie-001</MenuItem>
          <MenuItem value="text-davinci-001">text-davinci-001</MenuItem>
          <MenuItem value="text-davinci-002">text-davinci-002</MenuItem>
        </Select>
      </FormControl>
      <Stack direction="row" spacing={2} justifyContent="flex-start">
        <Typography variant="subtitle2">Max_Tokens:</Typography>
        <Slider
          size="small"
          step={32}
          min={64}
          max={512}
          marks
          valueLabelDisplay="auto"
          value={maxTokens}
          onChange={handleMaxTokensChange}
        />
      </Stack>
    </Stack>
  )
}

export default OptionsIndex

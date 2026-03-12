import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { SearchIcon } from "lucide-react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function InputGroupInlineStart({...props}: InputProps) {
  return (
    <Field className="max-w-sm">
      <InputGroup>
        <InputGroupInput id="inline-start-input" placeholder="Search..." {...props} />
        <InputGroupAddon align="inline-start">
          <SearchIcon className="text-muted-foreground" />
        </InputGroupAddon>
      </InputGroup>
    </Field>
  )
}

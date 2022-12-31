import { useState } from "react"

interface FormInputProps {
    name: string
    placeholder?: string
    value: string
    setValue: (value: string) => void
    password?: boolean
    mt?: string
}

function FormInput(props: FormInputProps) {
    const [highlightLabel, setHighlightLabel] = useState(false);
    
    return (
    <div className = {`${props.mt ? props.mt : "mt-2"} text-left`}>

        <input 
            value = {props.value}
            onChange = {(e) => props.setValue(e.target.value)}
            type = {props.password ? "password" : "text"}
            placeholder = {props.placeholder} 

            onFocus = {() => setHighlightLabel(true)}
            onBlur = {() => setHighlightLabel(false)}
            className = "text-white bg-transparent rounded-t block p-1 w-full border-b border-b-white focus:outline-none"/>


        <label className = "text-xs ml-1 text-white/50" style = {highlightLabel ? {color: "white"} : undefined}>{props.name}</label>

    </div>
    )
}


export default FormInput;
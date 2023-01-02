import { useState } from "react"

interface FormInputProps {
    name: string
    placeholder?: string
    value: string
    setValue: (value: string) => void
    password?: boolean
    mt?: string
    valid: boolean
}

function FormInput(props: FormInputProps) {
    
    return (
    <div className = {`${props.mt ? props.mt : "mt-2"} text-left`}>

        <input 
            value = {props.value}
            onChange = {(e) => props.setValue(e.target.value)}
            type = {props.password ? "password" : "text"}
            placeholder = {props.placeholder} 

            className = "text-white bg-transparent rounded-t rounded-none block p-1 w-full border-b border-b-white focus:outline-none"/>


        <label className = {`text-xs ml-1 ${props.valid ? "text-white/90" : "text-rose-100/60"}`}>{props.name}</label>

    </div>
    )
}


export default FormInput;
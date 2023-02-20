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
    <div className = {`${props.mt ? props.mt : "mt-4"} text-left`}>

        <input 
            value = {props.value}
            onChange = {(e) => props.setValue(e.target.value)}
            type = {props.password ? "password" : "text"}
            placeholder = {props.placeholder} 

            className = "text-white rounded block p-1 w-full bg-white/10 border-b border-b-white focus:outline-none"/>


        <label className = {`text-xs ml-1 ${props.valid ? "text-white/90" : "text-sky-100/60"}`}>{props.name}</label>

    </div>
    )
}


export default FormInput;
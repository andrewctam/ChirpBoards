interface FormInputProps {
    name: string
    placeholder?: string
    value: string
    setValue: (value: string) => void
    password?: boolean
    marginTop?: string
    valid: boolean
}

function FormInput(props: FormInputProps) {
    
    return (
    <div className = "text-center" style = {{marginTop: props.marginTop ?? "0px"}}>
        <input 
            value = {props.value}
            onChange = {(e) => props.setValue(e.target.value)}
            type = {props.password ? "password" : "text"}
            placeholder = {props.placeholder} 

            className = "text-black rounded block p-1 w-full bg-[#d7d3d3] shadow-md focus:outline-none"/>


        <label className = {`text-xs ${props.valid ? "text-green-200/90" : "text-white"}`}>{props.name}</label>
    </div>
    )
}


export default FormInput;
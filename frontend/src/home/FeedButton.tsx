
type FeedButtonProps = {
    name: string,
    onClick: () => void,
    isActive: boolean
}

function FeedButton (props: FeedButtonProps) {
    return (
        <button 
            onClick = {props.onClick}
            className = {`px-4 py-2 rounded m-1 border text-xs sm:text-base border-black/10 ${props.isActive ? "bg-sky-300" : "bg-sky-100"}`}>
            {props.name}
        </button>)
}

export default FeedButton

type FeedButtonProps = {
    name: string,
    onClick: () => void,
    isActive: boolean
}

function FeedButton (props: FeedButtonProps) {
    return (
        <button 
            onClick = {props.onClick}
            className = {`p-1 rounded-xl m-1 text-white text-xs sm:text-base shadow-md ${props.isActive ? "bg-sky-300/50" : "bg-black/20"}`}>
            {props.name}
        </button>)
}

export default FeedButton
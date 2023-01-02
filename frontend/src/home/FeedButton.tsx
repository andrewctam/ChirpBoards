
type FeedButtonProps = {
    name: string,
    onClick: () => void,
    isActive: boolean
}

function FeedButton (props: FeedButtonProps) {
    return (
        <button 
            onClick = {props.onClick}
            className = {`px-4 py-2 rounded-2xl m-1 border text-white text-xs sm:text-base border-black/50 ${props.isActive ? "bg-sky-500/50" : "bg-black/20"}`}>
            {props.name}
        </button>)
}

export default FeedButton
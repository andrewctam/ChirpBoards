import { Feed } from "./Home"

interface FeedButtonProps {
    type: Feed
    name: string
    setFeed: (type: Feed) => void
    isActive: boolean
}

function FeedButton (props: FeedButtonProps) {
    return (
        <button 
            onClick = { () => props.setFeed(props.type) }
            className = {`px-4 py-2 rounded m-1 border border-black/10 ${props.isActive ? "bg-sky-200" : "bg-slate-300"}`}>
            {props.name}
        </button>)
}

export default FeedButton
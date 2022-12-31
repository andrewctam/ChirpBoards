import { Feed } from "./Home"
import { SearchFeed } from "../search/Search"

type FeedButtonProps = {
    name: string,
    onClick: () => void,
    isActive: boolean
}

function FeedButton (props: FeedButtonProps) {
    return (
        <button 
            onClick = {props.onClick}
            className = {`px-4 py-2 rounded m-1 border border-black/10 ${props.isActive ? "bg-green-100" : "bg-slate-300"}`}>
            {props.name}
        </button>)
}

export default FeedButton
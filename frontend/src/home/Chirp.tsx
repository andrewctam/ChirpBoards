import { useContext } from "react"
import { PostChirp, UserContext } from "../App"
import Vote from "../boards/Vote"
import useOptions from "../hooks/useOptions"

export type Rechirper = {
    username: string
    displayName: string
    userColor: string
    dateRechirped: string
}   

interface ChirpProps extends PostChirp {
    pinned: boolean | null
    userColor: string

    //user who rechirped, only relevant on profile where they are displayed. 
    //different from rechirpStatus (which is if the current user rechirped this post)
    rechirper?: Rechirper | undefined 
}

function Chirp(props: ChirpProps) {
    const userInfo = useContext(UserContext);
    const [dots, editor] = useOptions(props.id, props.text, userInfo.state.username === props.authorUsername, props.pinned, props.rechirpStatus)

    return (
    <li className={`w-full relative mb-8`}>
        <div className="block bg-black/20 text-white p-1 pr-6 rounded-bl-xl rounded-tr-xl truncate">

             {editor ? 
                <div className = "m-8">
                    {editor}
                </div> 
                :
                <a href={`/board/${props.id}`}>
                    <div className={`w-full max-h-96 overflow-y-hidden whitespace-pre-line p-6 ${props.rechirper ? "pt-14" : "pt-10"} text-sm break-all text-white`}>
                        {props.text}
                    </div>
                </a>
            }

            <div className = "absolute top-2 left-2 max-w-[90%] overflow-x-hidden">
                {props.rechirper  ? 
                <div className = "text-xs ml-2">
                    <a href={`/profile/${props.rechirper.username}`} style = {{color: props.rechirper.userColor ?? "white"}}>
                        {props.rechirper.displayName}
                    </a>

                    <span className = "text-sky-200">
                        {` rechirped on ${props.rechirper.dateRechirped}`}
                    </span>
                </div> : null}

                <a href={`/profile/${props.authorUsername}`} className="text-xs ml-2 inline" style = {{color: props.userColor}}>
                    {props.authorDisplayName}
                </a>
                <a href={`/profile/${props.authorUsername}`} className="text-xs m-0 inline h-fit"> 
                    {` • @${props.authorUsername}`}
                </a>
                <div className="text-xs inline"> 
                    {` • ${props.postDate}`} 
                </div>

                {props.isEdited ? 
                    <div className = "text-xs inline italics">
                        <span className = "text-white">
                            {` • `}
                        </span>
                        <span className = "text-yellow-300">
                            {`edited`}
                        </span>
                    </div>
                : null}

                {props.pinned ? 
                    <div className = "text-xs inline font-bold">
                        <span className = "text-white">
                            {` • `}
                        </span>
                        <span className = "text-rose-300">
                            {`pinned`}
                        </span>
                    </div>
                : null}
            </div>

        </div>


        {dots}
        <Vote postId={props.id} initialScore={props.score} initialVoteStatus = {props.voteStatus}/>
    </li>
    )


}


export default Chirp
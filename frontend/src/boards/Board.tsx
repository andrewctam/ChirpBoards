import { useContext, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { PostChirp, PostPayload, UserContext } from "../App"
import useOptions from "../hooks/useOptions"
import useScrollBottom from "../hooks/useScrollBottom"
import useSort from "../hooks/useSort"
import Layout from "../Layout"
import SpinningCircle from "../SpinningCircle"
import UserPhoto from "../UserPhoto"
import Comment from "./Comment"
import CommentsPlaceholder from "./CommentsPlaceholder"
import ReplyBox from "./ReplyBox"
import Vote from "./Vote"

export interface Post extends PostChirp {
    commentCount: number
    parentPost?: string | null
    rootPost?: string | null
    userColor: string
}


function Board() {
    const [mainPost, setMainPost] = useState<Post | null>(null)

    const [comments, setComments] = useState<JSX.Element[]>([])
    const [doneFetching, setDoneFetching] = useState(false);
    //local comments are sent to the server, but also store them here to avoid a 2nd fetch
    const [localComments, setLocalComments] = useState<JSX.Element[]>([])

    const [pageNum, setPageNum] = useState(0); //start at 1 because the first page is already loaded
    const [hasNextPage, setHasNextPage] = useState(true);
    
    const params = useParams();
    const navigate = useNavigate();
    
    const userInfo = useContext(UserContext);
    

    useEffect( () => {
        //on load, get the params
        if (params && params.id) {
            fetchPost(params.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [] )

    useEffect(() => {
        //get comments after the main post loads
        if (mainPost) {
            if (mainPost.commentCount > 0) 
                getComments();
            else
                setDoneFetching(true)

        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mainPost])


    
    const fetchPost = async (postId: string) => {
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const timezone = (-(new Date().getTimezoneOffset() / 60)).toString()

        const query =
        `query {    
            post(id: "${postId}"${userInfo.state.username ? `, relatedUsername: "${userInfo.state.username}"` : ""}) {
                author {
                    username
                    displayName
                    userColor
                    pictureURL
                }
                text
                imageURL
                parentPost {
                    id
                }
                rootPost {
                    id
                }
                isComment
                isEdited
                postDate(timezone: ${timezone})
                score
                commentCount
                ${userInfo.state.username ? "voteStatus" : ""}
                ${userInfo.state.username ? "rechirpStatus" : ""}
            }
        }`

        const response = await fetch(url ?? '', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({query})
        }).then(res => res.json())
        console.log(response)

        if (response.errors || !response.data.post)
            navigate("/");

        const info: PostPayload = response.data.post;
        setMainPost({
            id: postId,
            text: info.text,
            imageURL: info.imageURL,
            voteStatus: userInfo.state.username ? info.voteStatus : 0,
            rechirpStatus: userInfo.state.username ? info.rechirpStatus : false,
            postDate: info.postDate,
            authorUsername: info.author.username,
            authorDisplayName: info.author.displayName,
            authorPictureURL: info.author.pictureURL,
            commentCount: info.commentCount,
            score: info.score,
            parentPost: info.parentPost ? info.parentPost.id : null,
            rootPost: info.rootPost ? info.rootPost.id : null,
            userColor: info.author.userColor,
            isEdited: info.isEdited,
        })

    }

    const getComments = async () => {
        if (!mainPost || !hasNextPage) {
            setDoneFetching(true)
            return; 
        }

    
        const timezone = (-(new Date().getTimezoneOffset() / 60)).toString()
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query =
        `query {    
            post(id: "${mainPost.id}"${userInfo.state.username ? `, relatedUsername: "${userInfo.state.username}"` : ""}) {
                comments(pageNum:${pageNum}, size:10, sortMethod: "${sortMethod}", sortDirection: "${sortDirection}") {
                    posts {
                        id
                        text
                        commentCount
                        postDate(timezone: ${timezone})
                        score
                        isEdited
                        ${userInfo.state.username ? "voteStatus" : ""}
                        ${userInfo.state.username ? "rechirpStatus" : ""}
                        author {
                            username
                            displayName
                            userColor
                            pictureURL
                        }
                    }
                    hasNext
                }
            }
        }`

        const response = await fetch(url ?? '', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({query})
        }).then(res => res.json())
        
        console.log(response)
        
        if (response.errors)
            navigate("/");
        
        const info = response.data.post;
        if (!info || info.isComment)
            navigate("/");

        setPageNum(pageNum + 1)
        setHasNextPage(info.comments.hasNext)

        setComments(comments.concat(
            info.comments.posts.map((comment: PostPayload) => {
                return <Comment
                    key = {comment.id}
                    id = {comment.id}
                    text = {comment.text}
                    postDate = {comment.postDate}
                    authorUsername = {comment.author.username}
                    authorDisplayName = {comment.author.displayName}
                    authorPictureURL = {comment.author.pictureURL}
                    commentCount = {comment.commentCount}
                    score = {comment.score}
                    isEdited = {comment.isEdited}
                    voteStatus = {userInfo.state.username ? comment.voteStatus : 0}
                    local = {false}
                    autoLoadComments = {mainPost.commentCount < 10}
                    userColor = {comment.author.userColor}
                    sortMethod = {sortMethod}
                    sortDirection = {sortDirection}
                    rechirpStatus = {userInfo.state.username ? comment.rechirpStatus : false}
                />
            }))
        )
        setDoneFetching(true);
    }


    const [sortMethod, sortDirection, sortBubble] = useSort(mainPost !== null, getComments, () => {
        setComments([])
        setLocalComments([])
        setPageNum(0)
        setHasNextPage(true);
    })

    useScrollBottom(async () => {
        setDoneFetching(false)
        await getComments()
    })

    const [dots, editor] = useOptions(
            mainPost ? mainPost.id : "",
            mainPost ? mainPost.text : "", 
            mainPost ? userInfo.state.username === mainPost.authorUsername : false,
            null,
            mainPost ? mainPost.rechirpStatus :false)
            
    return (
        <Layout>
            {!mainPost ? null :
            <div className = "mx-auto w-11/12 md:w-4/5">
                {sortBubble}

                {mainPost.parentPost ? 
                    <div className = "my-6 ml-4">

                        {mainPost.rootPost && mainPost.parentPost !== mainPost.rootPost ?
                        <p className = "mb-2">
                            <a href={`/board/${mainPost.rootPost}`} className = "text-blue-400">← Top of the board</a>
                        </p>    
                        : null}

                        <p>
                            <a href={`/board/${mainPost.parentPost}`} className = "text-blue-200">← Parent post</a>
                        </p>    
                    </div>
                : null}

                <div>
                    <div className = "w-full mt-6 mb-6 p-6 rounded-bl-xl rounded-tr-xl bg-black/20 text-white relative break-all shadow-md">
                        <div>
                            <a href={`/profile/${mainPost.authorUsername}`}>
                                <UserPhoto
                                    url = {mainPost.authorPictureURL}
                                    userColor = {mainPost.userColor}
                                    size = {40}
                                />
                            </a>

                            <a href={`/profile/${mainPost.authorUsername}`} className = "text-lg ml-2" style = {{color: mainPost.userColor}}>
                                {mainPost.authorDisplayName}
                            </a>

                            <a href={`/profile/${mainPost.authorUsername}`} className = "text-sm">
                                {` • @${mainPost.authorUsername}`}
                            </a>
                            
                            <div className = "text-sm inline">
                                {` • ${mainPost.postDate}`}
                            </div>

                            {mainPost.isEdited ? 
                                <div className = "text-sm inline italics">
                                    <span className = "text-white">
                                        {` • `}
                                    </span>
                                    <span className = "text-yellow-300">
                                        {`edited`}
                                    </span>
                                </div>
                            : null}     
                        </div>

                        {editor ? editor :
                        <div className = "whitespace-pre-line ml-[48px]">
                            {mainPost.text}
                        </div>}

                        {mainPost.imageURL ? 
                            <img src = {mainPost.imageURL} className = "mx-auto max-h-[50vh] rounded my-8" />
                        : null }

                        {dots}

                        <Vote postId = {mainPost.id} initialScore = {mainPost.score} initialVoteStatus = {mainPost.voteStatus}/>

                    </div>
                </div>
                
                <div className = "bg-black/20 p-4 my-2 rounded-xl shadow-md">
                    {userInfo.state.username ?
                    <ReplyBox 
                        postId = {mainPost.id} 
                        sortMethod = {sortMethod}
                        sortDirection = {sortDirection}
                        addReply = {(reply) => {
                            setLocalComments([reply, ...localComments])
                        }}/> 
                    : null}

                    {!doneFetching ? <SpinningCircle /> : null}

                    {
                    localComments.length === 0 && comments.length === 0 ?
                    <>
                        <CommentsPlaceholder opacity = {"90%"} showNoComments = {doneFetching}/>
                        <CommentsPlaceholder opacity = {"50%"} />
                        <CommentsPlaceholder opacity = {"25%"} />
                    </>
                    :
                        <div className = "w-full mb-10 border-l-white">
                            {
                            localComments.length > 0 ? localComments.concat(comments) 
                            :
                            comments}
                        </div>
                    }
                </div>
            </div>}
        </Layout>
    )


}


export default Board
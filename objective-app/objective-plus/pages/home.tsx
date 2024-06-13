import { Flex } from '@radix-ui/themes'
import ProjectsSection from '../components/projects'
import ScenesSection from '../components/scenes'
import { useViewport } from '../../objective/hooks/useVieport'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch } from '../hooks/redux'
import { useSelector } from 'react-redux'
import { IProject, selectAllProjects } from '../store/projects/reducer'
import { useEffect } from 'react'
import { loadProject, loadProjects, loadScene, loadScenes } from '../store/projects/actions'

const ProjectsPage = () => {
  const { projectId } = useParams()
  const { width } = useViewport()
  const isSmallViewPort = width <= 576

  const dispatch = useDispatch()
  const navigate = useNavigate()

  // [1] set projectId to path param, if it's not there
  // NOTE: this logic is only for not isSmallViewPort
  const allProjects = useSelector(selectAllProjects())
  const defaultProject = allProjects[0] as IProject | undefined
  useEffect(() => {
    if (!isSmallViewPort && !projectId && defaultProject) navigate(`/projects/${defaultProject.id}`)
  }, [isSmallViewPort, projectId, defaultProject])

  // [2] load projects and it's scenes
  // FIXME
  // here is might be double request for the same resource (for all scenes, and scene by id)
  // bu it's needed for now to invalidate external (other user's) scene data stored at local storage

  // load all user's projects (incl deleted)
  useEffect(() => {
    dispatch(loadProjects({ is_deleted: false }))
      .unwrap()
      .then((projects) => {
        // load full scenes info here for thumbnails render only
        dispatch(loadScenes({}))
      })
    dispatch(loadProjects({ is_deleted: true }))
  }, [dispatch])

  // load current project from path parameters
  // (means it's other user project access via external link)

  useEffect(() => {
    if (projectId)
      dispatch(loadProject({ id: projectId }))
        .unwrap()
        .then((project) => {
          // Load full scenes info here for thumbnails render only
          if (!project.is_deleted)
            project.scenes.forEach((scene) => dispatch(loadScene({ id: scene.id })))
        })
  }, [projectId, dispatch])

  return (
    <Flex style={{ height: 'calc(100% - 40px)' }}>
      {!isSmallViewPort || !projectId ? <ProjectsSection /> : null}
      {!isSmallViewPort || projectId ? <ScenesSection /> : null}
    </Flex>
  )
}

export default ProjectsPage

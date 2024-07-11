import { Flex, Table, Text } from '@radix-ui/themes'
import { FC } from 'react'
import { useSelector } from '../hooks/redux'
import { selectScenes, selectProject } from '../store/projects/selectors'
import { useParams } from 'react-router-dom'
import { AddSceneItem, SceneItemIcon, SceneItemRow, SceneItemRowForExport } from './scenes-item'

export const ScenesTable: FC = () => {
  const { projectId } = useParams()
  const project = useSelector(selectProject(projectId))
  const scenes = useSelector(selectScenes(project?.id))
  return (
    <>
      {scenes.length ? (
        <Table.Root
          className='scene-table'
          style={{
            maxHeight: '70vh',
            overflowY: 'scroll',
          }}
        >
          <Table.Header>
            <Table.Row>
              <Table.Cell>
                <Text color={'gray'} weight={'light'}>
                  {'Title'}
                </Text>
              </Table.Cell>
              <Table.Cell>
                <Text color={'gray'} weight={'light'}>
                  {'Date Created'}
                </Text>
              </Table.Cell>
              <Table.Cell>
                <Text color={'gray'} weight={'light'}>
                  {'Date Modified'}
                </Text>
              </Table.Cell>
              <Table.Cell> </Table.Cell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {scenes.map((p) => (
              <SceneItemRow key={p.id} scene={p} />
            ))}
          </Table.Body>
        </Table.Root>
      ) : null}
      <AddSceneItem />
    </>
  )
}

export const ScenesTableForExportDialog: FC = () => {
  const { projectId } = useParams()
  const project = useSelector(selectProject(projectId))
  const scenes = useSelector(selectScenes(project?.id))
  return (
    <Table.Root
      // className='scene-table'
      style={{
        width: '100%',
      }}
    >
      <Table.Header>
        <Table.Row>
          <Table.Cell justify={'center'}>
            <Text color={'gray'} weight={'light'}>
              {'Title'}
            </Text>
          </Table.Cell>
          <Table.Cell justify={'center'}>
            <Text color={'gray'} weight={'light'}>
              {'Top Plan'}
            </Text>
          </Table.Cell>
          <Table.Cell justify={'center'}>
            <Text color={'gray'} weight={'light'}>
              {'Shot List'}
            </Text>
          </Table.Cell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {scenes.map((p) => (
          <SceneItemRowForExport key={p.id} scene={p} />
        ))}
      </Table.Body>
    </Table.Root>
  )
}

export const ScenesIcons: FC = () => {
  const { projectId } = useParams()
  const project = useSelector(selectProject(projectId))
  const scenes = useSelector(selectScenes(project?.id))
  return (
    <Flex
      wrap={'wrap'}
      style={{
        maxHeight: '80vh',
        overflowY: 'scroll',
      }}
    >
      {scenes.map((p) => (
        <SceneItemIcon key={p.id} scene={p} />
      ))}
      <AddSceneItem />
    </Flex>
  )
}

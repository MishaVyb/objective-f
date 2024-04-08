import { TextArea, TextField } from '@radix-ui/themes'
import { ObjectiveCard, RootBox } from '../components/layout'

const DebugPage = () => {
  return (
    <RootBox>
      <ObjectiveCard>
        <div
          style={{
            minHeight: 300, //
            // background: 'red'
          }}
        >
          {/* <div className='debug-content'>
            <Button className='my-button'>{'Button'}</Button>
          </div> */}
          <div className='debug-content'>
            <input
              className='my-text-field' //
            />
            <TextField.Root
              className='my-text-field' //
            >
              <TextField.Root
                variant='soft'
                color={'gray'}
                className='my-text-field' //
                placeholder='Search the docs…'
              />
            </TextField.Root>
            <TextArea className='my-text-field' />
          </div>
        </div>
      </ObjectiveCard>
    </RootBox>
  )
}

export default DebugPage

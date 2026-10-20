"""Train a BiLSTM on exact, weighted repetition-code bit-flip examples.
One perfect syndrome round; not a surface-code or circuit-noise benchmark.
"""
import json, math
from pathlib import Path
import numpy as np
import torch
from torch import nn

torch.set_num_threads(2)
torch.manual_seed(42)
class Decoder(nn.Module):
    def __init__(self):
        super().__init__()
        self.rnn=nn.LSTM(1,32,batch_first=True,bidirectional=True)
        self.head=nn.Linear(64,1)
    def forward(self,x):
        _,(h,_)=self.rnn(x)
        return self.head(torch.cat([h[-2],h[-1]],1)).squeeze(1)

def train(d):
    errors=np.array([[(i>>j)&1 for j in range(d)] for i in range(2**d)],dtype=np.float32)
    syndrome=(errors[:,:-1]!=errors[:,1:]).astype(np.float32)
    x=torch.tensor(syndrome[:,:,None]);y=torch.tensor(errors[:,0])
    # Equal mixture of p=.05,.10,.15,.20; exact probability mass, no sampling artifacts.
    weights=sum(p**errors.sum(1)*(1-p)**(d-errors.sum(1)) for p in [.05,.1,.15,.2])/4
    w=torch.tensor(weights,dtype=torch.float32)
    model=Decoder();optimizer=torch.optim.Adam(model.parameters(),lr=.015)
    for epoch in range(650):
        optimizer.zero_grad();loss=(nn.functional.binary_cross_entropy_with_logits(model(x),y,reduction='none')*w).sum();loss.backward();optimizer.step()
    s=np.array([[(i>>j)&1 for j in range(d-1)] for i in range(2**(d-1))],dtype=np.float32)
    with torch.no_grad():prob=torch.sigmoid(model(torch.tensor(s[:,:,None]))).numpy().tolist()
    output={'distance':d,'p_e0':prob,'architecture':'BiLSTM(1,32,bidirectional) → Linear(64,1)','training_noise':[.05,.1,.15,.2],'epochs':650,'seed':42,'final_loss':float(loss.detach()),'syndrome_order':'least significant bit first','noise_model':'independent X errors; one perfect syndrome round'}
    path=Path(__file__).parent/'models';torch.save(model.state_dict(),path/f'bilstm-d{d}.pt');(path/f'd{d}.json').write_text(json.dumps(output,indent=2))
    print('distance',d,'loss',output['final_loss'],flush=True)
if __name__=='__main__':
    for d in [3,5,7]:train(d)

import os
import requests


def call_service(file_path):
    file_name = os.path.basename(file_path)
    files = {
        'file': (file_name, open(file_path, mode='rb'), 'application/octet-stream')
    }
    # resp = requests.post(url, data=payload, files=files)
    resp = requests.put(url, files=files)

    print(resp.text)

    # data = StringIO(s)
    #
    # df = pd.read_csv(data, header=None)
    # df.to_csv(
    #     '/Users/amandeep/Github/table-linker/tl/utility/t2dv2/candidates/47709681_0_4437772923903322343.csv'.format(
    #         file_name[:-4]), index=False, header=False)
    # print(resp.text)
    # return resp.status_code


url = "http://localhost:14000/datasets/QUAZ/variable/P2006020015"
file_path = 'uaz_sample.csv'
call_service(file_path)

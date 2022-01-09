# This file loads the USA CS Faculty at Top 50 Universities dataset and
# creates some plots from them
# Uses dataset downloaded on 2014-June-17
# Author: Srinath Sridhar
# ssridhar@mpi-inf.mpg.de
# srinathsridhar.com
import csv
dataset_file_handle = open('2014-June-17_CS_Faculty_Information.csv', 'rb')
data = csv.DictReader(dataset_file_handle, skipinitialspace = True)
data_fields = data.fieldnames

num_records = 0
bachelors_outside_us = []
masters_outside_us = []
phd_outside_us = []
# India stuff
india_bachelors = []
india_masters = []
india_phd = []
# Other countries
countries_of_interest = set()
countries_bachelors = {}
countries_masters = {}
countries_phd = {}
    
for prof in data:
    # NOTE: There is one problem entry with Korea/South Korea. Fix this manually
    for level in ['Bachelors', 'Masters', 'Doctorate']:
        if '- Korea' in prof[level]:
            prof[level] = prof[level].replace('- Korea', '- South Korea')
        if not 'USA' in prof[level].split('-')[-1].strip():
           countries_of_interest.add(prof[level].split('-')[-1].strip()) # Assuming the last word is the country

    num_records += 1

    # For India-specific analysis
    if 'India' in prof['Bachelors'].split('-')[-1].strip():
        india_bachelors.append(prof)
    if 'India' in prof['Masters'].split('-')[-1].strip():
        india_masters.append(prof)
    if 'India' in prof['Doctorate'].split('-')[-1].strip():
        india_phd.append(prof)

countries_of_interest = list(countries_of_interest)
countries_of_interest.sort()
countries_of_interest_copy = list(countries_of_interest) # Create copy
# print(countries_of_interest)
# print('\n%d\n'%len(countries_of_interest))
for country in countries_of_interest_copy: # Create empty counts
    # Clean countries list to remove non-countries
    if 'University' in country or 'university' in country or 'college' in country or 'College' in country or country in '':
        countries_of_interest.remove(country) # Safe since countries_of_interest was originally a set
    else:
        countries_bachelors.setdefault(country, 0)
        countries_masters.setdefault(country, 0)
        countries_phd.setdefault(country, 0)

# print(countries_of_interest)
# print('\n%d\n'%len(countries_of_interest))

# Goto top of file (might be slow)
dataset_file_handle.seek(0)
for prof in data:
    for country in countries_of_interest:
        if country in prof['Bachelors'].split('-')[-1].strip():
            countries_bachelors[country] += 1
            bachelors_outside_us.append(prof)
        if country in prof['Masters'].split('-')[-1].strip():
            countries_masters[country] += 1
            masters_outside_us.append(prof)
        if country in prof['Doctorate'].split('-')[-1].strip():
            countries_phd[country] += 1
            phd_outside_us.append(prof)
        
# Summarize statistics
print("%d CS professors from top 50 US universities in the Brown dataset.\n" % num_records)
print("======================\nWorld\n======================")
print("%d have a bachelors degree from outside the US. That's %f %%." %(len(bachelors_outside_us), float(len(bachelors_outside_us))/float(num_records) * 100.0))
print("%d have a masters degree from outside the US. That's %f %%." %(len(masters_outside_us), float(len(masters_outside_us))/float(num_records) * 100.0))
print("%d have a PhD from outside the US. That's %f %%.\n" %(len(phd_outside_us), float(len(phd_outside_us))/float(num_records) * 100.0))

# Sanity checks
print(float(sum(countries_bachelors.values()))/float(num_records) * 100.0)
print(float(sum(countries_masters.values()))/float(num_records) * 100.0)
print(float(sum(countries_phd.values()))/float(num_records) * 100.0)

print("Here is the country wise summary\n\n\n")

# Country-wise table
print("=============================================================================================================")
print("          Country          |          Bachelors          |          Masters          |          PhD")
print("=============================================================================================================")

# Other countries
for country in countries_of_interest:
    print("          %s          %d (%f)          %d (%f)          %d (%f)          " %(country, countries_bachelors[country], float(countries_bachelors[country])/float(num_records) * 100.0,
          countries_masters[country], float(countries_masters[country])/float(num_records) * 100.0,
    countries_phd[country], float(countries_phd[country])/float(num_records) * 100.0))
